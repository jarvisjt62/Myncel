import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic';

async function verifyCaptcha(captchaToken?: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return { success: true }
  if (!captchaToken) return { success: false, error: 'Captcha verification is required' }

  const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: captchaToken }),
  })
  const captchaData = await captchaRes.json()
  if (!captchaData.success || captchaData.score < 0.5) {
    return { success: false, error: 'Captcha verification failed' }
  }
  if (captchaData.action && captchaData.action !== 'reset_password') {
    return { success: false, error: 'Captcha action mismatch' }
  }
  return { success: true }
}

export async function POST(req: NextRequest) {
  try {
    const { token, password, captchaToken } = await req.json()

    const captchaResult = await verifyCaptcha(captchaToken)
    if (!captchaResult.success) {
      return NextResponse.json({ error: captchaResult.error || 'Captcha verification failed' }, { status: 400 })
    }

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Find valid reset token
    const reset = await db.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!reset) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    if (reset.used) {
      return NextResponse.json({ error: 'This reset link has already been used' }, { status: 400 })
    }

    if (reset.expires < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 })
    }

    // Update password and mark token as used
    const hashedPassword = await bcrypt.hash(password, 12)

    await db.$transaction([
      db.user.update({
        where: { id: reset.userId },
        data: { password: hashedPassword },
      }),
      db.passwordReset.update({
        where: { id: reset.id },
        data: { used: true },
      }),
    ])

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}