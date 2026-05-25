import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { lookupGeo } from './geo-ip'

/**
 * Extract { ipAddress, userAgent } from the request the NextAuth credentials
 * authorize() callback receives. NextAuth v4 passes a Node-style `req` here
 * (not a Web `Request`), so headers come as a plain object.
 *
 * Returns 'unknown' for missing values so the audit row is still useful.
 */
function getClientInfoFromAuthReq(req: any): { ipAddress: string; userAgent: string } {
  const headers = req?.headers ?? {};
  const fwd = headers['x-forwarded-for'] ?? headers['X-Forwarded-For'];
  const fwdStr = Array.isArray(fwd) ? fwd[0] : fwd;
  const realIp = headers['x-real-ip'] ?? headers['X-Real-IP'];
  const ua = headers['user-agent'] ?? headers['User-Agent'] ?? 'unknown';
  const ipAddress = (typeof fwdStr === 'string' && fwdStr.split(',')[0].trim())
    || (typeof realIp === 'string' && realIp.trim())
    || 'unknown';
  return { ipAddress, userAgent: typeof ua === 'string' ? ua : 'unknown' };
}

/**
 * Fire-and-forget login audit logger. Does its own geo lookup with a 1.5s
 * timeout so a slow geo provider can never block sign-in. All errors swallowed.
 */
function recordLoginEvent(args: {
  outcome: 'LOGIN' | 'LOGIN_FAILED';
  userId?: string | null;
  email: string;
  organizationId?: string | null;
  ipAddress: string;
  userAgent: string;
  reason?: string;
}) {
  // Don't await — never block sign-in on this.
  ;(async () => {
    try {
      const geo = args.ipAddress && args.ipAddress !== 'unknown'
        ? await lookupGeo(args.ipAddress)
        : null;

      await db.auditLog.create({
        data: {
          action: args.outcome,
          entity: 'User',
          entityId: args.userId ?? args.email, // for LOGIN_FAILED with no user, store email
          userId: args.userId ?? null,
          organizationId: args.organizationId ?? null,
          ipAddress: args.ipAddress,
          userAgent: args.userAgent,
          changes: {
            email: args.email,
            geo: geo ?? null,
            reason: args.reason ?? null,
          } as any,
        },
      });
    } catch (err) {
      // Audit log failures must never break auth — just swallow.
      console.error('[auth] failed to write LOGIN audit row:', err);
    }
  })();
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    })
    const data = await res.json()
    return data.success && data.score >= 0.5
  } catch {
    return false
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        captchaToken: { label: 'Captcha Token', type: 'text' },
      },
      async authorize(credentials, req) {
        const { ipAddress, userAgent } = getClientInfoFromAuthReq(req)
        const emailRaw = (credentials?.email ?? '').toString().trim().toLowerCase()

        if (!credentials?.email || !credentials?.password) {
          recordLoginEvent({
            outcome: 'LOGIN_FAILED', email: emailRaw || '(missing)',
            ipAddress, userAgent, reason: 'missing_credentials',
          })
          throw new Error('Email and password are required')
        }

        // Verify reCAPTCHA (skip if not configured)
        const captchaToken = (credentials as any).captchaToken
        if (process.env.RECAPTCHA_SECRET_KEY && captchaToken) {
          const isValidCaptcha = await verifyRecaptcha(captchaToken)
          if (!isValidCaptcha) {
            recordLoginEvent({
              outcome: 'LOGIN_FAILED', email: emailRaw,
              ipAddress, userAgent, reason: 'captcha_failed',
            })
            throw new Error('Captcha verification failed')
          }
        }

        const user = await db.user.findUnique({
          where: { email: emailRaw },
          include: { organization: true },
        })

        if (!user || !user.password) {
          recordLoginEvent({
            outcome: 'LOGIN_FAILED', email: emailRaw,
            ipAddress, userAgent, reason: 'no_account',
          })
          throw new Error('No account found with this email')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          recordLoginEvent({
            outcome: 'LOGIN_FAILED', userId: user.id, email: emailRaw,
            organizationId: user.organizationId,
            ipAddress, userAgent, reason: 'wrong_password',
          })
          throw new Error('Incorrect password')
        }

        // Account-deletion check (Apple App Review Guideline 5.1.1(v)).
        //
        // If the user previously initiated account deletion, block
        // sign-in. They must contact support to recover within the
        // 14-day grace window — we deliberately do NOT auto-cancel
        // deletion on a successful login because it would be a
        // confusing UX (a forgotten old session reactivating a
        // deletion the user thought was happening). Recovery happens
        // via /api/user/delete-account/cancel, exposed in the
        // confirmation email Apple's reviewer will see when they
        // initiate deletion.
        if (user.deletionRequestedAt) {
          const graceDays = 14
          const elapsedDays =
            (Date.now() - user.deletionRequestedAt.getTime()) /
            (1000 * 60 * 60 * 24)
          const daysLeft = Math.max(0, Math.ceil(graceDays - elapsedDays))
          recordLoginEvent({
            outcome: 'LOGIN_FAILED', userId: user.id, email: emailRaw,
            organizationId: user.organizationId,
            ipAddress, userAgent, reason: 'pending_deletion',
          })
          throw new Error(
            `This account is scheduled for deletion in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Contact support to recover it.`
          )
        }

        // Check email verification (one-time check — once verified, no further checks)
        // Admin always bypasses verification
        if (!user.emailVerified && user.email !== 'admin@myncel.com') {
          recordLoginEvent({
            outcome: 'LOGIN_FAILED', userId: user.id, email: emailRaw,
            organizationId: user.organizationId,
            ipAddress, userAgent, reason: 'email_not_verified',
          })
          throw new Error('Please verify your email address before signing in. Check your inbox for a verification link.')
        }

        // Auto-verify admin if not yet verified
        if (!user.emailVerified && user.email === 'admin@myncel.com') {
          db.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          }).catch(() => {})
        }

        // Update last login info (non-blocking) — now also captures IP
        db.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress,
            failedLoginAttempts: 0,
          },
        }).catch(() => {})

        // Audit-log the successful login (non-blocking, includes geo lookup).
        recordLoginEvent({
          outcome: 'LOGIN', userId: user.id, email: emailRaw,
          organizationId: user.organizationId,
          ipAddress, userAgent,
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role
        token.organizationId = (user as any).organizationId
        token.organizationName = (user as any).organizationName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.organizationName = token.organizationName as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}