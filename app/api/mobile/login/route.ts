import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signMobileToken } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mobile/login
 * Body: { email: string, password: string }
 * Returns: { token, user }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').toLowerCase().trim()
    const password = String(body.password || '')

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { organization: true },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Account lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: 'Account temporarily locked. Try again later.' },
        { status: 423 }
      )
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      // Increment failed attempts (non-blocking)
      db.user
        .update({
          where: { id: user.id },
          data: { failedLoginAttempts: { increment: 1 } },
        })
        .catch(() => {})
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Email verification check (admin bypasses)
    if (!user.emailVerified && user.email !== 'admin@myncel.com') {
      return NextResponse.json(
        {
          error:
            'Please verify your email address before signing in. Check your inbox for a verification link.',
        },
        { status: 403 }
      )
    }

    // Update last login (non-blocking)
    db.user
      .update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          failedLoginAttempts: 0,
        },
      })
      .catch(() => {})

    const token = signMobileToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization?.name ?? null,
      },
    })
  } catch (err) {
    console.error('[mobile/login] error:', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
