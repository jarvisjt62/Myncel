import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(clientIp, RATE_LIMITS.PASSWORD_RESET);
    if (!rateLimit.success) {
      return NextResponse.json({ 
        error: 'Too many password reset requests. Please try again later.',
        retryAfter: rateLimit.retryAfter 
      }, { 
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfter || 3600) }
      });
    }

    const { email, captchaToken } = await req.json()

    // Verify reCAPTCHA
    if (process.env.RECAPTCHA_SECRET_KEY && captchaToken) {
      const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      })
      const captchaData = await captchaRes.json()
      if (!captchaData.success || captchaData.score < 0.5) {
        return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 })
      }
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' })
    }

    // Delete any existing reset tokens
    await db.passwordReset.deleteMany({
      where: { userId: user.id },
    })

    // Create new reset token (expires in 1 hour)
    const reset = await db.passwordReset.create({
      data: {
        userId: user.id,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    // Send email
    await sendPasswordResetEmail(user.email!, reset.token, user.name || 'there')

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}