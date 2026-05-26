import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  extractBearer,
  resolveScimToken,
  toScimUser,
  scimListResponse,
  scimError,
  parseSimpleFilter,
} from '@/lib/sso/scim';

/**
 * GET /api/scim/v2/Users          — list users (with optional filter)
 * POST /api/scim/v2/Users          — create user (provision)
 *
 * Authentication: Bearer <SCIM token>. The token resolves to an
 * organizationId; every read and write is scoped to that org.
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

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;
  const { organizationId } = auth.ctx;

  const url = new URL(req.url);
  const filter = url.searchParams.get('filter');
  const startIndex = Math.max(1, parseInt(url.searchParams.get('startIndex') || '1', 10) || 1);
  const count = Math.min(200, Math.max(1, parseInt(url.searchParams.get('count') || '100', 10) || 100));

  const where: any = { organizationId };
  const parsed = parseSimpleFilter(filter);
  if (parsed) {
    if (parsed.field === 'userName' || parsed.field === 'emails' || parsed.field === 'emails.value') {
      where.email = parsed.value.toLowerCase();
    } else if (parsed.field === 'externalId') {
      where.scimExternalId = parsed.value;
    } else {
      // Unsupported filter — return empty list rather than 400 to keep
      // most IdPs happy (Okta in particular probes with "active eq true").
    }
  }

  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: startIndex - 1,
      take: count,
    }),
  ]);

  const baseUrl = getBaseUrl(req);
  const resources = rows.map((u) => toScimUser(u, baseUrl));
  return NextResponse.json(scimListResponse(resources, total, startIndex, resources.length), {
    headers: { 'Content-Type': 'application/scim+json' },
  });
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;
  const { organizationId } = auth.ctx;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(scimError(400, 'Invalid JSON body'), { status: 400 });
  }

  const userName = String(body.userName || '').trim().toLowerCase();
  if (!userName) {
    return NextResponse.json(scimError(400, 'userName is required'), { status: 400 });
  }

  // Pull primary email; default to userName.
  const primaryEmail =
    Array.isArray(body.emails) && body.emails.length > 0
      ? String((body.emails.find((e: any) => e.primary) || body.emails[0]).value || userName)
      : userName;

  const givenName = body.name?.givenName ? String(body.name.givenName) : '';
  const familyName = body.name?.familyName ? String(body.name.familyName) : '';
  const displayName =
    body.displayName ||
    [givenName, familyName].filter(Boolean).join(' ') ||
    null;

  const externalId = body.externalId ? String(body.externalId) : null;

  // If a user with this email already exists in this org, return 409.
  // SCIM spec: 409 Conflict + scimType=uniqueness.
  const existing = await db.user.findFirst({
    where: { email: primaryEmail.toLowerCase(), organizationId },
  });
  if (existing) {
    return NextResponse.json(
      scimError(409, 'A user with this userName already exists', 'uniqueness'),
      { status: 409 }
    );
  }

  const created = await db.user.create({
    data: {
      email: primaryEmail.toLowerCase(),
      name: displayName,
      organizationId,
      scimExternalId: externalId,
      scimManaged: true,
      // SCIM-provisioned users are email-verified by definition (the IdP
      // is the source of truth).
      emailVerified: new Date(),
      role: 'MEMBER',
    },
  });

  // Audit row
  void db.auditLog
    .create({
      data: {
        action: 'CREATE',
        entity: 'User',
        entityId: created.id,
        organizationId,
        changes: { method: 'scim', userName, externalId } as any,
      },
    })
    .catch(() => { /* swallow */ });

  const baseUrl = getBaseUrl(req);
  return NextResponse.json(toScimUser(created, baseUrl), {
    status: 201,
    headers: {
      'Content-Type': 'application/scim+json',
      Location: `${baseUrl}/api/scim/v2/Users/${created.id}`,
    },
  });
}

export const dynamic = 'force-dynamic';
