import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { db } from './db'

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Verify reCAPTCHA (skip if not configured)
        const captchaToken = (credentials as any).captchaToken
        if (process.env.RECAPTCHA_SECRET_KEY && captchaToken) {
          const isValidCaptcha = await verifyRecaptcha(captchaToken)
          if (!isValidCaptcha) {
            throw new Error('Captcha verification failed')
          }
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { organization: true },
        })

        if (!user || !user.password) {
          throw new Error('No account found with this email')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
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
          throw new Error(
            `This account is scheduled for deletion in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Contact support to recover it.`
          )
        }

        // Check email verification (one-time check — once verified, no further checks)
        // Admin always bypasses verification
        if (!user.emailVerified && user.email !== 'admin@myncel.com') {
          throw new Error('Please verify your email address before signing in. Check your inbox for a verification link.')
        }

        // Auto-verify admin if not yet verified
        if (!user.emailVerified && user.email === 'admin@myncel.com') {
          db.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          }).catch(() => {})
        }

        // Update last login info (non-blocking)
        db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), failedLoginAttempts: 0 },
        }).catch(() => {})

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