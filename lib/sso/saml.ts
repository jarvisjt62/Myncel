/**
 * SAML 2.0 helper — thin wrapper around @node-saml/node-saml
 *
 * Why a wrapper:
 *   - Each Myncel org has its own IdP, so we instantiate node-saml
 *     fresh per request rather than caching a global singleton.
 *   - Centralizes the SP (Myncel-side) configuration: entry point,
 *     callback URL, certificate, signing algorithm.
 *   - Provides typed `buildLoginUrl()` / `validateResponse()` helpers
 *     that the route handlers can call without dealing with raw XML.
 *
 * Key design decisions:
 *   - HTTP-Redirect binding for the AuthnRequest (simpler, no cert on
 *     the SP side required for unsigned requests; supported by every
 *     major IdP). HTTP-POST binding for the SAMLResponse (the IdP
 *     standard).
 *   - We DO require the IdP to sign the SAMLResponse (the assertion
 *     itself); unsigned responses are rejected. This is the SAML
 *     security baseline.
 *   - NameID format defaults to emailAddress; configurable per org.
 *
 * Environment requirements:
 *   - APP_URL (or NEXTAUTH_URL) must be set so we can compute the
 *     ACS callback URL the IdP will POST to.
 */

import { SAML, type SamlConfig } from '@node-saml/node-saml';
import type { SsoConfig } from '@prisma/client';

/** SP-side issuer/entity-id we publish in metadata. */
export function getSpIssuer(orgSlug: string): string {
  const base = getAppUrl();
  return `${base}/api/auth/saml/${orgSlug}/metadata`;
}

/** SP-side ACS (Assertion Consumer Service) URL — where the IdP POSTs the SAMLResponse. */
export function getCallbackUrl(orgSlug: string): string {
  const base = getAppUrl();
  return `${base}/api/auth/saml/${orgSlug}/callback`;
}

/** Returns the public-facing app URL with no trailing slash. */
function getAppUrl(): string {
  const raw =
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.myncel.com';
  return raw.replace(/\/+$/, '');
}

/**
 * Build a per-org SAML instance. Throws if the SsoConfig is missing
 * required fields (callers should check `enabled` first).
 */
export function buildSamlClient(orgSlug: string, cfg: SsoConfig): SAML {
  if (!cfg.idpSsoUrl || !cfg.idpEntityId || !cfg.idpCertificate) {
    throw new Error('SSO config is incomplete');
  }

  const samlConfig: SamlConfig = {
    // SP side
    issuer: getSpIssuer(orgSlug),
    callbackUrl: getCallbackUrl(orgSlug),
    // IdP side
    entryPoint: cfg.idpSsoUrl,
    idpIssuer: cfg.idpEntityId,
    idpCert: cfg.idpCertificate,
    // Crypto
    signatureAlgorithm: 'sha256',
    digestAlgorithm: 'sha256',
    // Don't require the AuthnRequest itself to be signed — most
    // IdPs don't enforce this and it removes the need for SP keypair
    // management on day one.
    wantAuthnResponseSigned: true,
    wantAssertionsSigned: true,
    // We don't sign our AuthnRequests (no SP private key yet).
    // Setting privateKey to undefined disables request signing.
    privateKey: undefined,
    identifierFormat: cfg.nameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    // Disable RequestedAuthnContext — Microsoft Azure AD rejects the
    // default Password context when SSO PRT is in play. Most other
    // IdPs accept either way.
    disableRequestedAuthnContext: true,
    // Required by node-saml v5+
    audience: getSpIssuer(orgSlug),
  };

  return new SAML(samlConfig);
}

/**
 * Build the IdP redirect URL for an AuthnRequest. The browser is
 * 302-redirected here to start the sign-in flow.
 *
 * @param relayState - opaque state forwarded by the IdP back to ACS.
 */
export async function buildLoginRedirectUrl(
  client: SAML,
  relayState: string
): Promise<string> {
  return client.getAuthorizeUrlAsync(relayState, undefined, {});
}

export interface ParsedSamlProfile {
  /** IdP-asserted NameID (usually email). Stable per user. */
  nameId: string;
  /** User email — falls back to NameID if no email attribute. */
  email: string;
  /** First + last name from attributes, joined. May be empty. */
  displayName: string;
  /** Group memberships from the configured groupsAttribute. */
  groups: string[];
  /** All attribute key → value(s) for debugging. */
  raw: Record<string, unknown>;
}

/**
 * Validate the SAMLResponse the IdP POSTed to /callback and extract
 * a normalized profile. Throws if the signature is invalid, the audience
 * doesn't match, or the assertion has expired.
 */
export async function validateSamlResponse(
  client: SAML,
  body: Record<string, string>,
  cfg: SsoConfig
): Promise<ParsedSamlProfile> {
  const result = await client.validatePostResponseAsync(body);
  const profile: any = result.profile;
  if (!profile) {
    throw new Error('SAML response did not contain a profile');
  }

  const attrs = (profile.attributes ?? {}) as Record<string, unknown>;

  const emailAttrKey = cfg.emailAttribute || 'email';
  const firstNameKey = cfg.firstNameAttribute || 'firstName';
  const lastNameKey = cfg.lastNameAttribute || 'lastName';
  const groupsKey = cfg.groupsAttribute || 'groups';

  const pickFirst = (key: string): string => {
    const v = attrs[key] ?? profile[key];
    if (Array.isArray(v)) return String(v[0] ?? '');
    return v == null ? '' : String(v);
  };
  const pickAll = (key: string): string[] => {
    const v = attrs[key] ?? profile[key];
    if (Array.isArray(v)) return v.map(String);
    if (v == null || v === '') return [];
    return [String(v)];
  };

  const nameId = String(profile.nameID ?? '').trim();
  const email =
    (pickFirst(emailAttrKey) ||
      // Common fallbacks for Microsoft / SAML claim namespaces
      pickFirst('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress') ||
      pickFirst('email') ||
      nameId)
      .toLowerCase()
      .trim();
  if (!email) {
    throw new Error('SAML response did not include an email');
  }

  const firstName = pickFirst(firstNameKey) || pickFirst('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname');
  const lastName = pickFirst(lastNameKey) || pickFirst('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname');
  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim();

  const groups = pickAll(groupsKey);

  return {
    nameId: nameId || email,
    email,
    displayName,
    groups,
    raw: { ...attrs, nameID: profile.nameID },
  };
}

/**
 * Generate the SP metadata XML the customer pastes into their IdP
 * during initial setup. Includes the SP entityID, ACS URL, and the
 * (optional) signing certificate.
 */
export function buildSpMetadataXml(orgSlug: string): string {
  const issuer = getSpIssuer(orgSlug);
  const acs = getCallbackUrl(orgSlug);
  return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${issuer}">
  <SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acs}" index="0" isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
}

/**
 * Map an IdP group name to a Myncel role. Defaults to the org's
 * defaultRole. Highest privilege wins if the user is in multiple groups.
 *
 * Group naming convention (case-insensitive substring match):
 *   - "myncel-owner" or "owner"      → OWNER
 *   - "myncel-admin" or "admin"      → ADMIN
 *   - "myncel-tech*" or "technician" → TECHNICIAN
 *   - "myncel-operator" or "operator"→ OPERATOR
 *   - "myncel-employee" or "employee"→ EMPLOYEE
 *   - everything else                → defaultRole (typically MEMBER)
 */
export type MyncelRole = 'OWNER' | 'ADMIN' | 'TECHNICIAN' | 'OPERATOR' | 'EMPLOYEE' | 'MEMBER';

export function deriveRoleFromGroups(
  groups: string[],
  defaultRole: MyncelRole
): MyncelRole {
  const lower = groups.map((g) => g.toLowerCase());
  if (lower.some((g) => g.includes('owner'))) return 'OWNER';
  if (lower.some((g) => g.includes('admin'))) return 'ADMIN';
  if (lower.some((g) => g.includes('tech'))) return 'TECHNICIAN';
  if (lower.some((g) => g.includes('operator'))) return 'OPERATOR';
  if (lower.some((g) => g.includes('employee'))) return 'EMPLOYEE';
  return defaultRole;
}
