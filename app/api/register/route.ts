import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { sendVerificationEmail, sendWelcomeEmail } from '@/lib/email'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(clientIp, RATE_LIMITS.REGISTER);
    if (!rateLimit.success) {
      return NextResponse.json({ 
        error: 'Too many registration attempts. Please try again later.',
        retryAfter: rateLimit.retryAfter 
      }, { 
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfter || 3600) }
      });
    }

    const { name, email, password, companyName, industry, companySize, captchaToken } = await req.json()

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

    // Validation
    if (!name || !email || !password || !companyName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
    }

    // Create organization slug
    const baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 50)
    let slug = baseSlug
    let slugCount = 0
    while (await db.organization.findUnique({ where: { slug } })) {
      slugCount++
      slug = `${baseSlug}-${slugCount}`
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create org + user in transaction
    const { user, organization } = await db.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: companyName,
          slug,
          industry: industry || 'OTHER',
          size: companySize || 'SMALL',
          plan: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
      })

      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'OWNER',
          organizationId: organization.id,
        },
      })

      // Create verification token
      await tx.verificationToken.create({
        data: {
          identifier: email.toLowerCase(),
          token: `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      })

      return { user, organization }
    })

    // Send welcome email (don't block on this)
    sendWelcomeEmail(user.email!, user.name!, organization.name).catch(console.error)

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: { id: user.id, email: user.email, name: user.name },
    }, { status: 201 })

  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}