import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

/**
 * GET /api/admin/login-activity
 *
 * Returns paged login events from `AuditLog` where action IN ('LOGIN', 'LOGIN_FAILED').
 *
 * Each row includes the user's email (resolved from User table when userId is
 * set, falling back to the email stored in `changes.email` for failed-login
 * rows that were never tied to a user record).
 *
 * Query params:
 *   ?page=1                  (1-indexed)
 *   ?pageSize=50             (max 200)
 *   ?email=substr            (filter by email substring, case-insensitive)
 *   ?status=success|failed|all (default 'all')
 *   ?from=ISO8601            (createdAt >= from)
 *   ?to=ISO8601              (createdAt <= to)
 *
 * Auth: super-admin only.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Forbidden — super-admin only' }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '50', 10) || 50));
  const emailFilter = (url.searchParams.get('email') ?? '').trim().toLowerCase();
  const statusFilter = (url.searchParams.get('status') ?? 'all').toLowerCase();
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  const actionWhere =
    statusFilter === 'success' ? { in: ['LOGIN'] } :
    statusFilter === 'failed'  ? { in: ['LOGIN_FAILED'] } :
                                 { in: ['LOGIN', 'LOGIN_FAILED'] };

  const where: any = { action: actionWhere };
  if (from) where.createdAt = { ...(where.createdAt ?? {}), gte: new Date(from) };
  if (to)   where.createdAt = { ...(where.createdAt ?? {}), lte: new Date(to) };

  // Email filter applies to the User relation OR the embedded changes.email.
  // We can't OR across JSON in Prisma cleanly, so:
  //   1. Query AuditLog rows by action+date.
  //   2. Filter by email in JS post-fetch when emailFilter is set.
  // For super-admin volumes this is fine; we still hit the index on (action, createdAt).
  // To keep pagination correct under a JS post-filter, we widen the DB pageSize when
  // a filter is applied.
  const dbTake = emailFilter ? pageSize * 5 : pageSize;
  const dbSkip = emailFilter ? 0 : (page - 1) * pageSize;

  const [rows, totalCount] = await Promise.all([
    safeQuery(
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: dbTake,
        skip: dbSkip,
        select: {
          id: true,
          action: true,
          entityId: true,
          ipAddress: true,
          userAgent: true,
          changes: true,
          createdAt: true,
          userId: true,
          organizationId: true,
          user: { select: { email: true, name: true } },
          organization: { select: { name: true } },
        },
      }),
      [] as any[]
    ),
    safeQuery(db.auditLog.count({ where }), 0),
  ]);

  // Shape & flatten each row
  let shaped = (rows as any[]).map(r => {
    const ch: any = r.changes ?? {};
    const email = r.user?.email ?? ch.email ?? r.entityId ?? null;
    const geo = ch.geo ?? null;
    return {
      id: r.id,
      action: r.action,                 // 'LOGIN' | 'LOGIN_FAILED'
      success: r.action === 'LOGIN',
      email,
      userName: r.user?.name ?? null,
      userId: r.userId,
      organizationName: r.organization?.name ?? null,
      ipAddress: r.ipAddress ?? null,
      userAgent: r.userAgent ?? null,
      geo,                              // { city, region, country, countryCode, isp } or null
      reason: ch.reason ?? null,        // populated for LOGIN_FAILED
      createdAt: r.createdAt,
    };
  });

  if (emailFilter) {
    shaped = shaped.filter(r => (r.email ?? '').toLowerCase().includes(emailFilter));
    // Re-paginate the filtered set
    const start = (page - 1) * pageSize;
    shaped = shaped.slice(start, start + pageSize);
  }

  return NextResponse.json({
    rows: shaped,
    page,
    pageSize,
    total: emailFilter ? null : totalCount, // exact total only meaningful w/o JS-side filter
    hasMore: shaped.length === pageSize,
  });
}
