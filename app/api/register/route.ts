import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { sendVerificationEmail, sendWelcomeEmail } from '@/lib/email'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'
import { DEFAULT_SETTINGS } from '@/lib/admin-settings'

export const dynamic = 'force-dynamic';

// Helper to get admin setting value from DB
async function getAdminSetting(key: string): Promise<any> {
  const record = await db.adminSetting.findUnique({ where: { key } }).catch(() => null);
  if (record) return JSON.parse(record.value);
  return DEFAULT_SETTINGS[key]?.value;
}

export async function POST(req: NextRequest) {
  try {
    // Check if signups are enabled
    const signupsEnabled = await getAdminSetting('platform.newSignups.enabled');
    if (signupsEnabled === false) {
      return NextResponse.json({ error: 'New registrations are currently disabled. Please contact support.' }, { status: 403 });
    }

    // Check if maintenance mode is on
    const maintenanceMode = await getAdminSetting('platform.maintenanceMode');
    if (maintenanceMode === true) {
      return NextResponse.json({ error: 'System is under maintenance. Please try again later.' }, { status: 503 });
    }

    // Check if invite-only mode is on
    const inviteOnly = await getAdminSetting('security.inviteOnly.enabled');
    if (inviteOnly === true) {
      return NextResponse.json({ error: 'Registration is by invitation only. Please use your invite link.' }, { status: 403 });
    }

    // Get configurable trial days
    const trialDays = await getAdminSetting('platform.trialDays');
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

    const passwordRequirements = [
      { met: password.length >= 8, message: 'at least 8 characters' },
      { met: /[A-Z]/.test(password), message: 'one uppercase letter' },
      { met: /[0-9]/.test(password), message: 'one number' },
      { met: /[^A-Za-z0-9]/.test(password), message: 'one special character' },
    ]

    const missingPasswordRequirements = passwordRequirements.filter(req => !req.met).map(req => req.message)
    if (missingPasswordRequirements.length) {
      return NextResponse.json({ error: `Password must include ${missingPasswordRequirements.join(', ')}.` }, { status: 400 })
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
    const { user, organization, verifyToken } = await db.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: companyName,
          slug,
          industry: industry || 'OTHER',
          size: companySize || 'SMALL',
          plan: 'TRIAL',
          trialEndsAt: new Date(Date.now() + (trialDays || 14) * 24 * 60 * 60 * 1000), // Configurable trial period
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
      const verifyToken = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
      await tx.verificationToken.create({
        data: {
          identifier: email.toLowerCase(),
          token: verifyToken,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      })

      return { user, organization, verifyToken }
    })

    // Send verification email
    try {
      const emailResult = await sendVerificationEmail(user.email!, verifyToken, user.name!);
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
      }
    } catch (emailErr) {
      console.error('Verification email send error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Account created. Please check your email to verify your account before signing in.',
      requiresVerification: true,
      user: { id: user.id, email: user.email, name: user.name },
    }, { status: 201 })

  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}