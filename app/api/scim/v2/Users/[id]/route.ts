import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  extractBearer,
  resolveScimToken,
  toScimUser,
  scimError,
} from '@/lib/sso/scim';

/**
 * GET    /api/scim/v2/Users/{id}  — fetch one
 * PUT    /api/scim/v2/Users/{id}  — full replace
 * PATCH  /api/scim/v2/Users/{id}  — partial update (most common from IdPs)
 * DELETE /api/scim/v2/Users/{id}  — deprovision (soft-delete via deletionRequestedAt)
 */

async function authenticate(req: NextRequest) {
  const token = extractBearer(req.headers.get('authorization'));
  if (!token) return { error: NextResponse.json(scimError(401, 'Missing bearer token'), { status: 401 }) };
  const ctx = await resolveScimToken(token);
  if (!ctx) return { error: NextResponse.json(scimError(401, 'Invalid or revoked token'), { status: 401 }) };
  return { ctx };
}

function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  return host ? `${proto}://${host}` : (process.env.APP_URL || 'https://www.myncel.com');
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;
  const { organizationId } = auth.ctx;

  const user = await db.user.findFirst({
    where: { id: params.id, organizationId },
  });
  if (!user) {
    return NextResponse.json(scimError(404, 'User not found'), { status: 404 });
  }
  return NextResponse.json(toScimUser(user, getBaseUrl(req)), {
    headers: { 'Content-Type': 'application/scim+json' },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;
  const { organizationId } = auth.ctx;

  const existing = await db.user.findFirst({
    where: { id: params.id, organizationId },
  });
  if (!existing) {
    return NextResponse.json(scimError(404, 'User not found'), { status: 404 });
  }

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json(scimError(400, 'Invalid JSON body'), { status: 400 });
  }

  const userName = body.userName ? String(body.userName).trim().toLowerCase() : existing.email;
  const givenName = body.name?.givenName ? String(body.name.givenName) : '';
  const familyName = body.name?.familyName ? String(body.name.familyName) : '';
  const displayName =
    body.displayName ||
    [givenName, familyName].filter(Boolean).join(' ') ||
    existing.name;

  const active = typeof body.active === 'boolean' ? body.active : true;
  const externalId = body.externalId !== undefined ? (body.externalId ? String(body.externalId) : null) : existing.scimExternalId;

  const updated = await db.user.update({
    where: { id: existing.id },
    data: {
      email: userName,
      name: displayName,
      scimExternalId: externalId,
      scimManaged: true,
      // active=false from the IdP triggers a deprovision (soft-delete)
      deletionRequestedAt: active ? null : (existing.deletionRequestedAt ?? new Date()),
    },
  });

  void db.auditLog
    .create({
      data: {
        action: 'UPDATE',
        entity: 'User',
        entityId: updated.id,
        organizationId,
        changes: { method: 'scim', op: 'PUT', active } as any,
      },
    })
    .catch(() => { /* swallow */ });

  return NextResponse.json(toScimUser(updated, getBaseUrl(req)), {
    headers: { 'Content-Type': 'application/scim+json' },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;
  const { organizationId } = auth.ctx;

  const existing = await db.user.findFirst({
    where: { id: params.id, organizationId },
  });
  if (!existing) {
    return NextResponse.json(scimError(404, 'User not found'), { status: 404 });
  }

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json(scimError(400, 'Invalid JSON body'), { status: 400 });
  }

  const ops: Array<{ op: string; path?: string; value?: any }> = Array.isArray(body.Operations)
    ? body.Operations
    : [];

  // Apply operations to a working object. We support the common cases:
  //   - replace active           → active flag toggle
  //   - replace name.givenName / name.familyName / displayName / userName
  //   - replace externalId
  // The full SCIM 2.0 PATCH grammar (filters, paths with brackets) is
  // intentionally NOT implemented — every major IdP only sends the
  // simple shapes above for User resources.
  let nextEmail = existing.email;
  let nextName = existing.name;
  let nextActive = !existing.deletionRequestedAt;
  let nextExternalId = existing.scimExternalId;

  for (const op of ops) {
    if (!op || op.op?.toLowerCase() !== 'replace' && op.op?.toLowerCase() !== 'add') continue;
    const path = (op.path || '').toLowerCase();
    const value = op.value;

    // No path = bulk object replace
    if (!path && typeof value === 'object' && value !== null) {
      if (typeof value.active === 'boolean') nextActive = value.active;
      if (typeof value.userName === 'string') nextEmail = value.userName.toLowerCase();
      if (typeof value.displayName === 'string') nextName = value.displayName;
      if (typeof value.externalId === 'string') nextExternalId = value.externalId;
      if (value.name && typeof value.name === 'object') {
        const f = (value.name.givenName || '').toString();
        const l = (value.name.familyName || '').toString();
        const combined = [f, l].filter(Boolean).join(' ');
        if (combined) nextName = combined;
      }
      continue;
    }

    if (path === 'active') nextActive = Boolean(value);
    else if (path === 'username') nextEmail = String(value).toLowerCase();
    else if (path === 'displayname') nextName = value == null ? nextName : String(value);
    else if (path === 'externalid') nextExternalId = value == null ? null : String(value);
    else if (path === 'name.givenname' || path === 'name.familyname') {
      // Reconstruct the full name from current pieces.
      const [g, ...rest] = (nextName || '').split(' ');
      let givenName = path === 'name.givenname' ? String(value || '') : g;
      let familyName = path === 'name.familyname' ? String(value || '') : rest.join(' ');
      nextName = [givenName, familyName].filter(Boolean).join(' ') || null;
    }
  }

  const updated = await db.user.update({
    where: { id: existing.id },
    data: {
      email: nextEmail,
      name: nextName,
      scimExternalId: nextExternalId,
      scimManaged: true,
      deletionRequestedAt: nextActive ? null : (existing.deletionRequestedAt ?? new Date()),
    },
  });

  void db.auditLog
    .create({
      data: {
        action: 'UPDATE',
        entity: 'User',
        entityId: updated.id,
        organizationId,
        changes: { method: 'scim', op: 'PATCH', active: nextActive } as any,
      },
    })
    .catch(() => { /* swallow */ });

  return NextResponse.json(toScimUser(updated, getBaseUrl(req)), {
    headers: { 'Content-Type': 'application/scim+json' },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;
  const { organizationId } = auth.ctx;

  const existing = await db.user.findFirst({
    where: { id: params.id, organizationId },
  });
  if (!existing) {
    return NextResponse.json(scimError(404, 'User not found'), { status: 404 });
  }

  // Soft-delete: set deletionRequestedAt. The same cron job that
  // handles end-user-initiated deletions will hard-delete after the
  // grace period — keeping SCIM and Apple-compliance behavior aligned.
  await db.user.update({
    where: { id: existing.id },
    data: {
      deletionRequestedAt: existing.deletionRequestedAt ?? new Date(),
      scimManaged: true,
    },
  });

  void db.auditLog
    .create({
      data: {
        action: 'DELETE',
        entity: 'User',
        entityId: existing.id,
        organizationId,
        changes: { method: 'scim', op: 'DELETE' } as any,
      },
    })
    .catch(() => { /* swallow */ });

  return new NextResponse(null, { status: 204 });
}

export const dynamic = 'force-dynamic';
