import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateScimToken } from '@/lib/sso/scim';

/**
 * GET /api/sso/scim-tokens   — list this org's SCIM tokens (no plaintext)
 * POST /api/sso/scim-tokens  — mint a new token; returns plaintext ONCE
 */

async function getAdminContext() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const orgId = (session?.user as any)?.organizationId;
  if (!session || !orgId) return null;
  if (role !== 'OWNER' && role !== 'ADMIN') return null;
  return { userId: (session.user as any).id as string, orgId };
}

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tokens = await db.scimToken.findMany({
    where: { organizationId: ctx.orgId, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      label: true,
      prefix: true,
      lastUsedAt: true,
      createdAt: true,
      createdBy: true,
    },
  });
  return NextResponse.json({ tokens });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const label = String(body.label || 'SCIM token').slice(0, 80);

  const { token, prefix, tokenHash } = generateScimToken();
  const created = await db.scimToken.create({
    data: {
      organizationId: ctx.orgId,
      label,
      prefix,
      tokenHash,
      createdBy: ctx.userId,
    },
  });

  void db.auditLog.create({
    data: {
      action: 'CREATE',
      entity: 'ScimToken',
      entityId: created.id,
      organizationId: ctx.orgId,
      userId: ctx.userId,
      changes: { label, prefix } as any,
    },
  }).catch(() => { /* swallow */ });

  return NextResponse.json({
    id: created.id,
    label: created.label,
    prefix: created.prefix,
    token, // plaintext — shown ONCE
    createdAt: created.createdAt,
  });
}

export const dynamic = 'force-dynamic';
