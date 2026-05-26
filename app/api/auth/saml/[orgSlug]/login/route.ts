import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildSamlClient, buildLoginRedirectUrl } from '@/lib/sso/saml';

/**
 * GET /api/auth/saml/[orgSlug]/login?returnTo=/dashboard
 *
 * Starts the SAML 2.0 sign-in flow:
 *   1. Looks up the org's SsoConfig.
 *   2. Builds an AuthnRequest using node-saml.
 *   3. 302-redirects the browser to the IdP's SSO URL.
 *
 * The IdP authenticates the user and POSTs a SAMLResponse back to
 * /api/auth/saml/<orgSlug>/callback (the ACS endpoint).
 */
export async function GET(
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

  // The relayState is forwarded back by the IdP. We pack the post-
  // sign-in destination into it so we can redirect there after we mint
  // the NextAuth session.
  const url = new URL(req.url);
  const returnTo = url.searchParams.get('returnTo') || '/dashboard';
  // Length cap so a malicious caller cannot stuff a huge value.
  const safeReturn = returnTo.length > 200 ? '/dashboard' : returnTo;
  // Only allow same-origin paths to prevent open-redirect.
  const relayState = safeReturn.startsWith('/') ? safeReturn : '/dashboard';

  try {
    const client = buildSamlClient(params.orgSlug, org.ssoConfig);
    const redirectUrl = await buildLoginRedirectUrl(client, relayState);
    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (err) {
    console.error('[saml/login] failed to build AuthnRequest:', err);
    return NextResponse.json(
      { error: 'Failed to start SAML sign-in' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
