import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkPlanLimit } from '@/lib/plan-limits';
import { guardPermission } from '@/lib/permissions';
import {
  validateEquipmentRow,
  MAX_IMPORT_ROWS,
  type ValidatedEquipmentRow,
  type RowError,
} from '@/lib/csv/equipment-template';

export const dynamic = 'force-dynamic';

interface ImportPayload {
  /**
   * Raw rows shipped from the client (strings only — server re-validates).
   * Each object is a header→value map.
   */
  rows?: Array<Record<string, string | undefined>>;
}

/**
 * Bulk-create machines from a CSV import.
 *
 * Flow:
 *   1. Authn + permission (machines.create) + plan-limit check
 *   2. Server-side re-validation of every row (never trust the client)
 *   3. De-duplicate against existing serial numbers in the same org
 *   4. Insert in a single transaction so partial-failure leaves DB clean
 *   5. Return per-row errors so the UI can pinpoint problems
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const denied = await guardPermission(
      (session.user as any).id,
      'machines.create'
    );
    if (denied) return denied;

    const body = (await req.json()) as ImportPayload;
    const rawRows = Array.isArray(body.rows) ? body.rows : [];

    if (rawRows.length === 0) {
      return NextResponse.json(
        { error: 'No rows to import' },
        { status: 400 }
      );
    }
    if (rawRows.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        {
          error: `Too many rows. Maximum ${MAX_IMPORT_ROWS} per import — please split your CSV.`,
        },
        { status: 400 }
      );
    }

    // --- Plan limit check (machines + new rows ≤ allowance) -----------------
    // We approximate by checking the limit once with the projected total.
    const limitCheck = await checkPlanLimit(
      session.user.organizationId,
      'machines'
    );
    // checkPlanLimit returns the live count; fail fast if even one more would
    // exceed it. A more permissive flow could insert up to the limit and skip
    // the rest, but failing the whole batch is friendlier than a partial
    // surprise the user can't undo.
    if (
      limitCheck.limit !== null &&
      typeof limitCheck.current === 'number' &&
      limitCheck.current + rawRows.length > limitCheck.limit
    ) {
      return NextResponse.json(
        {
          error: `Plan limit exceeded. Your ${limitCheck.plan} plan allows ${limitCheck.limit} machines; you have ${limitCheck.current} and tried to add ${rawRows.length}.`,
          code: 'PLAN_LIMIT_EXCEEDED',
          resource: 'machines',
          current: limitCheck.current,
          limit: limitCheck.limit,
          plan: limitCheck.plan,
        },
        { status: 403 }
      );
    }

    // --- Server-side validation (mirrors client) ----------------------------
    const validRows: ValidatedEquipmentRow[] = [];
    const rowErrors: RowError[] = [];

    rawRows.forEach((raw, idx) => {
      // rowIndex is 1-based and accounts for the header row at line 1,
      // so the first data row reports as line 2 — matches what the user
      // sees when they open the CSV in Excel.
      const result: any = validateEquipmentRow(raw, idx + 2);
      if (result.ok) {
        validRows.push(result.row as ValidatedEquipmentRow);
      } else {
        rowErrors.push(...(result.errors as RowError[]));
      }
    });

    // --- Duplicate detection on serialNumber within the org -----------------
    const incomingSerials = validRows
      .map((r) => r.serialNumber)
      .filter((s): s is string => !!s);

    const existingSerialDocs =
      incomingSerials.length > 0
        ? await db.machine.findMany({
            where: {
              organizationId: session.user.organizationId,
              serialNumber: { in: incomingSerials },
            },
            select: { serialNumber: true },
          })
        : [];

    const existingSerialSet = new Set(
      existingSerialDocs
        .map((d) => d.serialNumber)
        .filter((s): s is string => !!s)
    );

    // Detect duplicates *within* the upload itself (CSV had two rows with the
    // same serial). Keep the first, flag the rest.
    const seenInUpload = new Set<string>();
    const insertable: ValidatedEquipmentRow[] = [];
    let skippedDuplicates = 0;

    for (const row of validRows) {
      if (row.serialNumber) {
        if (existingSerialSet.has(row.serialNumber)) {
          rowErrors.push({
            rowIndex: row.rowIndex,
            field: 'serialNumber',
            message: `serialNumber "${row.serialNumber}" already exists in your organization`,
          });
          skippedDuplicates += 1;
          continue;
        }
        if (seenInUpload.has(row.serialNumber)) {
          rowErrors.push({
            rowIndex: row.rowIndex,
            field: 'serialNumber',
            message: `serialNumber "${row.serialNumber}" appears more than once in this CSV`,
          });
          skippedDuplicates += 1;
          continue;
        }
        seenInUpload.add(row.serialNumber);
      }
      insertable.push(row);
    }

    if (insertable.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid rows to import',
          imported: 0,
          skipped: rawRows.length,
          errors: rowErrors,
        },
        { status: 400 }
      );
    }

    // --- Bulk insert in a transaction ---------------------------------------
    // Prisma's createMany is faster, but we want each row to honor the schema
    // defaults (cuid id, timestamps) and we don't need return values, so it's
    // a perfect fit. `skipDuplicates` is a no-op for us (we already filtered)
    // but kept for safety on Postgres.
    const orgId = session.user.organizationId;
    const inserted = await db.machine.createMany({
      data: insertable.map((r) => ({
        name: r.name,
        category: r.category,
        manufacturer: r.manufacturer,
        model: r.model,
        serialNumber: r.serialNumber,
        location: r.location,
        criticality: r.criticality,
        status: r.status,
        yearInstalled: r.yearInstalled,
        notes: r.notes,
        organizationId: orgId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      imported: inserted.count,
      skipped: rawRows.length - inserted.count,
      duplicatesSkipped: skippedDuplicates,
      errors: rowErrors,
    });
  } catch (error) {
    console.error('Equipment import error:', error);
    return NextResponse.json(
      { error: 'Failed to import equipment' },
      { status: 500 }
    );
  }
}
