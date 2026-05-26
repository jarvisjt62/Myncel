import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { db } from '@/lib/db';
import {
  buildSamlClient,
  validateSamlResponse,
  deriveRoleFromGroups,
} from '@/lib/sso/saml';

/**
 * POST /api/auth/saml/[orgSlug]/callback
 *
 * Assertion Consumer Service (ACS). The IdP POSTs a signed
 * SAMLResponse (form-urlencoded SAMLResponse=base64, RelayState=path)
 * to this endpoint after the user authenticates.
 *
 * Flow:
 *   1. Validate the signed SAMLResponse (audience, signature, expiry).
 *   2. JIT-provision or look up the Myncel User row by NameID/email.
 *   3. Mint a NextAuth-compatible JWT session and set the cookie.
 *   4. 302 to the relayState path (defaults to /dashboard).
 *
 * Security:
 *   - Rejects unsigned assertions (wantAssertionsSigned=true in the
 *     node-saml config).
 *   - Rejects responses whose audience does not match our SP entityID.
 *   - Rejects expired assertions.
 *   - Records LOGIN / LOGIN_FAILED rows in AuditLog.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  const org = await db.organization.findUnique({
    where: { slug: params.orgSlug },
    include: { ssoConfig: true },
  });
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  if (!org.ssoConfig || !org.ssoConfig.enabled) {
    return NextResponse.json(
      { error: 'SSO is not enabled for this organization' },
      { status: 404 }
    );
  }

  // Parse form body (IdP HTTP-POST binding).
  let body: Record<string, string>;
  try {
    const form = await req.formData();
    body = {};
    form.forEach((v, k) => {
      body[k] = String(v);
    });
  } catch (err) {
    console.error('[saml/callback] failed to parse form body:', err);
    return NextResponse.redirect(
      `${getAppOrigin(req)}/signin?error=saml_invalid_response`,
      { status: 302 }
    );
  }

  // Validate the signed SAMLResponse and extract the profile.
  let profile;
  try {
    const client = buildSamlClient(params.orgSlug, org.ssoConfig);
    profile = await validateSamlResponse(client, body, org.ssoConfig);
  } catch (err) {
    console.error('[saml/callback] SAMLResponse validation failed:', err);
    void recordLoginFailed(org.id, body, 'saml_invalid_response', req);
    return NextResponse.redirect(
      `${getAppOrigin(req)}/signin?error=saml_invalid_response`,
      { status: 302 }
    );
  }

  // JIT-provision or look up the user. We match in this order:
  //   1. samlNameId (most stable — survives email changes)
  //   2. email within the same org
  //   3. create new User
  let user = await db.user.findFirst({
    where: { samlNameId: profile.nameId, organizationId: org.id },
  });
  if (!user) {
    user = await db.user.findFirst({
      where: { email: profile.email, organizationId: org.id },
    });
  }

  // Determine role from group claims (or fall back to the org's default).
  const role = deriveRoleFromGroups(profile.groups, org.ssoConfig.defaultRole);

  if (!user) {
    user = await db.user.create({
      data: {
        email: profile.email,
        name: profile.displayName || null,
        organizationId: org.id,
        samlNameId: profile.nameId,
        emailVerified: new Date(), // SAML asserts the email
        role,
      },
    });
  } else {
    // Reconcile drifted fields.
    const updates: Record<string, unknown> = {};
    if (user.samlNameId !== profile.nameId) updates.samlNameId = profile.nameId;
    if (profile.displayName && user.name !== profile.displayName)
      updates.name = profile.displayName;
    // Only adjust role if IdP has a group mapping and the user is not
    // an OWNER (we never demote owners via SSO group sync).
    if (profile.groups.length > 0 && user.role !== 'OWNER' && user.role !== role) {
      updates.role = role;
    }
    if (!user.emailVerified) updates.emailVerified = new Date();
    if (Object.keys(updates).length > 0) {
      user = await db.user.update({
        where: { id: user.id },
        data: { ...updates, lastLoginAt: new Date() },
      });
    } else {
      user = await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }
  }

  // Block sign-in for users in the deletion-grace window.
  if (user.deletionRequestedAt) {
    return NextResponse.redirect(
      `${getAppOrigin(req)}/signin?error=account_pending_deletion`,
      { status: 302 }
    );
  }

  // Mint a NextAuth-compatible JWT session token.
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error('[saml/callback] NEXTAUTH_SECRET is not set');
    return NextResponse.redirect(
      `${getAppOrigin(req)}/signin?error=server_misconfigured`,
      { status: 302 }
    );
  }
  const maxAge = 30 * 24 * 60 * 60; // 30 days, matches authOptions
  const token = await encode({
    secret,
    maxAge,
    token: {
      id: user.id,
      email: user.email,
      name: user.name ?? '',
      role: user.role,
      organizationId: org.id,
      organizationName: org.name,
      // Mark the session as SAML-issued so we can show a badge in the UI.
      authMethod: 'saml',
    },
  });

  // Resolve where to send the user post-login.
  const relayState = body['RelayState'] || '/dashboard';
  const safeReturn = relayState.startsWith('/') ? relayState : '/dashboard';

  // Build the response with the session cookie. Cookie name and flags
  // must match NextAuth's defaults so the existing middleware accepts it.
  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

  const res = NextResponse.redirect(`${getAppOrigin(req)}${safeReturn}`, {
    status: 302,
  });
  res.cookies.set({
    name: cookieName,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge,
  });

  void recordLoginSuccess(org.id, user.id, user.email, req);
  return res;
}

/** Helper: derive the same-origin base URL from the incoming request. */
function getAppOrigin(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  return host ? `${proto}://${host}` : (process.env.APP_URL || 'https://www.myncel.com');
}

function getClientInfo(req: NextRequest) {
  const fwd = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = (fwd?.split(',')[0] || realIp || 'unknown').trim();
  const ua = req.headers.get('user-agent') || 'unknown';
  return { ipAddress: ip, userAgent: ua };
}

async function recordLoginSuccess(
  organizationId: string,
  userId: string,
  email: string,
  req: NextRequest
) {
  try {
    const { ipAddress, userAgent } = getClientInfo(req);
    await db.auditLog.create({
      data: {
        action: 'LOGIN',
        entity: 'User',
        entityId: userId,
        userId,
        organizationId,
        ipAddress,
        userAgent,
        changes: { email, method: 'saml' } as any,
      },
    });
  } catch (err) {
    console.error('[saml/callback] failed to write LOGIN audit:', err);
  }
}

async function recordLoginFailed(
  organizationId: string,
  body: Record<string, string>,
  reason: string,
  req: NextRequest
) {
  try {
    const { ipAddress, userAgent } = getClientInfo(req);
    // Best-effort email extraction for the audit row.
    const email = body['email'] || 'unknown';
    await db.auditLog.create({
      data: {
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: email,
        organizationId,
        ipAddress,
        userAgent,
        changes: { method: 'saml', reason } as any,
      },
    });
  } catch (err) {
    console.error('[saml/callback] failed to write LOGIN_FAILED audit:', err);
  }
}

export const dynamic = 'force-dynamic';
