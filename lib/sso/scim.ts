/**
 * SCIM 2.0 helpers — bearer-token authentication and resource shaping.
 *
 * SCIM (System for Cross-domain Identity Management, RFC 7643/7644) is
 * the standard REST protocol every major IdP (Okta, Azure AD, Google
 * Workspace, OneLogin, JumpCloud) speaks for user/group provisioning.
 * The IdP sends:
 *
 *   GET    /scim/v2/Users         — list/search users
 *   GET    /scim/v2/Users/{id}    — get one user
 *   POST   /scim/v2/Users         — create user (provision)
 *   PUT    /scim/v2/Users/{id}    — full replace
 *   PATCH  /scim/v2/Users/{id}    — partial update (most common from IdPs)
 *   DELETE /scim/v2/Users/{id}    — deprovision
 *
 * Authentication is a static bearer token the customer admin pastes
 * into their IdP's "Provisioning" screen. We hash these tokens at rest
 * (SHA-256) so a database leak does not yield IdP write access.
 *
 * Multi-tenancy: every SCIM call carries the bearer token; from the
 * token's tokenHash we resolve the organizationId and scope every read
 * and write to that org.
 */

import { createHash, randomBytes } from 'crypto';
import { db } from '../db';

/** Hash a SCIM bearer token for storage / comparison. */
export function hashScimToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Generate a fresh SCIM bearer token. Returns the plaintext (shown once). */
export function generateScimToken(): { token: string; prefix: string; tokenHash: string } {
  // 32 bytes → 64 hex chars; prefix the human-readable hint.
  const raw = randomBytes(32).toString('hex');
  const token = `myn_scim_${raw}`;
  return {
    token,
    prefix: token.slice(0, 12), // "myn_scim_xxx"
    tokenHash: hashScimToken(token),
  };
}

/** Read the bearer token from the Authorization header. Returns null on miss. */
export function extractBearer(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/**
 * Resolve a SCIM bearer token to its owning organization. Updates
 * `lastUsedAt` for audit purposes. Returns null if the token is
 * unknown or revoked.
 */
export async function resolveScimToken(token: string): Promise<{
  organizationId: string;
  tokenId: string;
} | null> {
  const tokenHash = hashScimToken(token);
  const row = await db.scimToken.findUnique({ where: { tokenHash } });
  if (!row) return null;
  if (row.revokedAt) return null;

  // Fire-and-forget audit timestamp update
  db.scimToken
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => { /* swallow — not critical */ });

  return { organizationId: row.organizationId, tokenId: row.id };
}

// ──────────────────────────────────────────────────────────────────
// SCIM resource shape helpers (RFC 7643)
// ──────────────────────────────────────────────────────────────────

export interface ScimEmail {
  value: string;
  primary?: boolean;
  type?: string;
}

export interface ScimName {
  givenName?: string;
  familyName?: string;
  formatted?: string;
}

export interface ScimUser {
  schemas: string[];
  id: string;
  externalId?: string;
  userName: string;
  name?: ScimName;
  emails?: ScimEmail[];
  active: boolean;
  displayName?: string;
  meta: {
    resourceType: 'User';
    created: string;
    lastModified: string;
    location: string;
  };
}

/** Convert a Myncel User row to a SCIM User resource. */
export function toScimUser(
  user: {
    id: string;
    name: string | null;
    email: string;
    scimExternalId: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletionRequestedAt?: Date | null;
  },
  baseUrl: string
): ScimUser {
  const [givenName, ...rest] = (user.name ?? '').split(' ');
  const familyName = rest.join(' ');
  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    id: user.id,
    externalId: user.scimExternalId ?? undefined,
    userName: user.email,
    name: user.name
      ? {
          givenName: givenName || undefined,
          familyName: familyName || undefined,
          formatted: user.name,
        }
      : undefined,
    emails: [{ value: user.email, primary: true, type: 'work' }],
    active: !user.deletionRequestedAt,
    displayName: user.name ?? undefined,
    meta: {
      resourceType: 'User',
      created: user.createdAt.toISOString(),
      lastModified: user.updatedAt.toISOString(),
      location: `${baseUrl}/api/scim/v2/Users/${user.id}`,
    },
  };
}

/** SCIM ListResponse envelope. */
export function scimListResponse<T>(
  resources: T[],
  totalResults: number,
  startIndex = 1,
  itemsPerPage = resources.length
) {
  return {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
    totalResults,
    startIndex,
    itemsPerPage,
    Resources: resources,
  };
}

/** SCIM error envelope (RFC 7644 §3.12). */
export function scimError(status: number, detail: string, scimType?: string) {
  return {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
    status: String(status),
    detail,
    ...(scimType ? { scimType } : {}),
  };
}

/** Parse a SCIM filter like `userName eq "alice@acme.com"`. Returns null on unknown shapes. */
export function parseSimpleFilter(filter: string | null | undefined):
  | { field: string; op: 'eq'; value: string }
  | null {
  if (!filter) return null;
  const m = filter.match(/^(\w+)\s+eq\s+"(.+)"$/i);
  if (!m) return null;
  return { field: m[1], op: 'eq', value: m[2] };
}
