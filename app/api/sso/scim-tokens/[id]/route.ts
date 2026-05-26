import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * DELETE /api/sso/scim-tokens/[id]  — revoke (soft-delete) a SCIM token
 */

async function getAdminContext() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const orgId = (session?.user as any)?.organizationId;
  if (!session || !orgId) return null;
  if (role !== 'OWNER' && role !== 'ADMIN') return null;
  return { userId: (session.user as any).id as string, orgId };
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = await db.scimToken.findFirst({
    where: { id: params.id, organizationId: ctx.orgId },
  });
  if (!token) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (token.revokedAt) return NextResponse.json({ ok: true, alreadyRevoked: true });

  await db.scimToken.update({
    where: { id: token.id },
    data: { revokedAt: new Date() },
  });

  void db.auditLog.create({
    data: {
      action: 'DELETE',
      entity: 'ScimToken',
      entityId: token.id,
      organizationId: ctx.orgId,
      userId: ctx.userId,
      changes: { label: token.label, prefix: token.prefix } as any,
    },
  }).catch(() => { /* swallow */ });

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
