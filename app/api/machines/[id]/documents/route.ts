/**
 * GET  /api/machines/[id]/documents   — list documents for a machine
 * POST /api/machines/[id]/documents   — attach a document
 *
 * Body for POST: { name, description?, kind?, url, filename?, mimeType?, sizeBytes? }
 *
 * Notes on uploads: today the URL field accepts either a hosted URL
 * (S3/R2/etc.) or a base64 data URL pasted directly. The DB column is
 * @db.Text but we soft-cap data URLs at ~5 MB to keep the row sane.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const MAX_DATAURL_BYTES = 5 * 1024 * 1024; // 5 MB
const VALID_KINDS = new Set(['MANUAL', 'DRAWING', 'PNID', 'DATASHEET', 'CERTIFICATE', 'PHOTO', 'OTHER']);

async function loadMachine(machineId: string, organizationId: string) {
  return safeQuery(
    () =>
      db.machine.findFirst({
        where: { id: machineId, organizationId },
        select: { id: true, organizationId: true },
      }),
    null,
  );
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const machine = await loadMachine(params.id, session.user.organizationId);
  if (!machine) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const documents = await safeQuery(
    () =>
      db.machineDocument.findMany({
        where: { machineId: params.id },
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { id: true, name: true, email: true } } },
      }),
    [],
  );

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id as string;
  if (!(await hasPermission(userId, 'machines.edit'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const machine = await loadMachine(params.id, session.user.organizationId);
  if (!machine) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? '').trim();
  const url = String(body?.url ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!url) return NextResponse.json({ error: 'A document URL or upload is required' }, { status: 400 });

  // Soft cap on data URLs to protect the DB.
  if (url.startsWith('data:') && url.length > MAX_DATAURL_BYTES * 1.4) {
    return NextResponse.json({ error: 'Embedded file is too large. Max 5 MB — host it externally for bigger files.' }, { status: 413 });
  }

  const kind = body?.kind && VALID_KINDS.has(body.kind) ? body.kind : 'OTHER';

  try {
    const doc = await db.machineDocument.create({
      data: {
        machineId: params.id,
        organizationId: session.user.organizationId,
        uploadedById: userId,
        name,
        description: body?.description ? String(body.description) : null,
        kind,
        url,
        filename: body?.filename ? String(body.filename) : null,
        mimeType: body?.mimeType ? String(body.mimeType) : null,
        sizeBytes: body?.sizeBytes ? Number(body.sizeBytes) : null,
      },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ document: doc });
  } catch (e) {
    console.error('[machines.documents.POST]', e);
    return NextResponse.json({ error: 'Failed to attach document' }, { status: 500 });
  }
}
