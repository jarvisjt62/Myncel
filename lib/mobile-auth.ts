/**
 * Mobile JWT authentication helpers.
 *
 * The web app uses NextAuth session cookies, which don't work well from a
 * native mobile app. The mobile app instead uses signed JWT bearer tokens
 * issued by `/api/mobile/login` and verified on every request via the
 * `Authorization: Bearer <token>` header.
 */
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { db } from './db'

const SECRET =
  process.env.MOBILE_JWT_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'change-me-in-production-please-set-MOBILE_JWT_SECRET'

const TOKEN_TTL = '30d'

export interface MobileTokenPayload {
  sub: string // user id
  email: string
  role: string
  organizationId: string | null
  /** Issued-at and expiry are added automatically by jsonwebtoken */
  iat?: number
  exp?: number
}

export interface MobileAuthUser {
  id: string
  email: string
  name: string | null
  role: string
  organizationId: string | null
  organizationName: string | null
}

export function signMobileToken(payload: Omit<MobileTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_TTL })
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as MobileTokenPayload
    return decoded
  } catch {
    return null
  }
}

/**
 * Extract a bearer token from the request `Authorization` header.
 * Returns `null` if no header or malformed.
 */
export function getBearerToken(req: NextRequest | Request): string | null {
  const header =
    (req as any).headers?.get?.('authorization') ||
    (req as any).headers?.get?.('Authorization')
  if (!header || typeof header !== 'string') return null
  const parts = header.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null
  return parts[1].trim() || null
}

/**
 * Verify the bearer token on a request and load the up-to-date user record.
 * Returns null if no token, token invalid, or user not found.
 */
export async function getMobileUser(req: NextRequest | Request): Promise<MobileAuthUser | null> {
  const token = getBearerToken(req)
  if (!token) return null

  const payload = verifyMobileToken(token)
  if (!payload?.sub) return null

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    include: { organization: true },
  })

  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organization?.name ?? null,
  }
}
