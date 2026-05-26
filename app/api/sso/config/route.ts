import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET / PUT  /api/sso/config
 *
 * Per-org SSO configuration for the signed-in admin. Only OWNER and
 * ADMIN roles can read or modify.
 */

async function getAdminContext() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const orgId = (session?.user as any)?.organizationId;
  if (!session || !orgId) return null;
  if (role !== 'OWNER' && role !== 'ADMIN') return null;
  return { userId: (session.user as any).id as string, orgId, role };
}

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cfg = await db.ssoConfig.findUnique({ where: { organizationId: ctx.orgId } });
  return NextResponse.json({ config: cfg });
}

export async function PUT(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const enabled = Boolean(body.enabled);
  const enforced = Boolean(body.enforced);
  const idpEntityId = String(body.idpEntityId || '').trim();
  const idpSsoUrl = String(body.idpSsoUrl || '').trim();
  const idpCertificate = String(body.idpCertificate || '').trim();

  // When the admin tries to enable, validate inputs.
  if (enabled) {
    if (!idpEntityId || !idpSsoUrl || !idpCertificate) {
      return NextResponse.json(
        { error: 'idpEntityId, idpSsoUrl and idpCertificate are all required to enable SSO.' },
        { status: 400 }
      );
    }
    if (!/^https?:\/\//.test(idpSsoUrl)) {
      return NextResponse.json({ error: 'idpSsoUrl must be a https://… URL.' }, { status: 400 });
    }
    if (!/-----BEGIN CERTIFICATE-----/.test(idpCertificate)) {
      return NextResponse.json(
        { error: 'idpCertificate must be a PEM-encoded X.509 certificate (BEGIN CERTIFICATE).' },
        { status: 400 }
      );
    }
  }

  const data = {
    enabled,
    enforced,
    idpEntityId,
    idpSsoUrl,
    idpCertificate,
    nameIdFormat: body.nameIdFormat ? String(body.nameIdFormat) : null,
    emailAttribute: body.emailAttribute ? String(body.emailAttribute) : null,
    firstNameAttribute: body.firstNameAttribute ? String(body.firstNameAttribute) : null,
    lastNameAttribute: body.lastNameAttribute ? String(body.lastNameAttribute) : null,
    groupsAttribute: body.groupsAttribute ? String(body.groupsAttribute) : null,
    defaultRole: ['OWNER', 'ADMIN', 'TECHNICIAN', 'OPERATOR', 'EMPLOYEE', 'MEMBER'].includes(body.defaultRole)
      ? body.defaultRole
      : 'MEMBER',
  };

  const upserted = await db.ssoConfig.upsert({
    where: { organizationId: ctx.orgId },
    create: { organizationId: ctx.orgId, ...data },
    update: data,
  });

  void db.auditLog.create({
    data: {
      action: 'UPDATE',
      entity: 'SsoConfig',
      entityId: upserted.id,
      organizationId: ctx.orgId,
      userId: ctx.userId,
      changes: { enabled, enforced } as any,
    },
  }).catch(() => { /* swallow */ });

  return NextResponse.json({ config: upserted });
}

export const dynamic = 'force-dynamic';
