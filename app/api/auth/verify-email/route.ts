import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function verifyCaptcha(captchaToken?: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { success: true };
  if (!captchaToken) return { success: false, error: 'Captcha verification is required' };

  const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: captchaToken }),
  });
  const captchaData = await captchaRes.json();
  if (!captchaData.success || captchaData.score < 0.5) {
    return { success: false, error: 'Captcha verification failed' };
  }
  if (captchaData.action && captchaData.action !== 'verify_email_resend') {
    return { success: false, error: 'Captcha action mismatch' };
  }
  return { success: true };
}

// GET /api/auth/verify-email?token=xxx — Verify email address
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.myncel.com';

  // Check if this is an AJAX/fetch request (from the page's auto-verify)
  const acceptHeader = req.headers.get('accept') || '';
  const isApiRequest = acceptHeader.includes('application/json') || 
                       req.headers.get('x-requested-with') === 'XMLHttpRequest';

  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      if (isApiRequest) return NextResponse.json({ error: 'missing-token' }, { status: 400 });
      return NextResponse.redirect(`${baseUrl}/verify-email?error=missing-token`);
    }

    // Find the verification token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      if (isApiRequest) return NextResponse.json({ error: 'invalid-token' }, { status: 400 });
      return NextResponse.redirect(`${baseUrl}/verify-email?error=invalid-token`);
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      if (isApiRequest) return NextResponse.json({ error: 'expired' }, { status: 400 });
      return NextResponse.redirect(`${baseUrl}/verify-email?error=expired`);
    }

    // Find the user by email (identifier)
    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      if (isApiRequest) return NextResponse.json({ error: 'user-not-found' }, { status: 400 });
      return NextResponse.redirect(`${baseUrl}/verify-email?error=user-not-found`);
    }

    // If already verified, just redirect to success
    if (user.emailVerified) {
      await db.verificationToken.delete({ where: { token } }).catch(() => {});
      if (isApiRequest) return NextResponse.json({ success: true, alreadyVerified: true });
      return NextResponse.redirect(`${baseUrl}/verify-email?success=true`);
    }

    // Mark email as verified and delete the token
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      db.verificationToken.delete({ where: { token } }),
    ]);

    if (isApiRequest) return NextResponse.json({ success: true });
    return NextResponse.redirect(`${baseUrl}/verify-email?success=true`);

  } catch (error) {
    console.error('Email verification error:', error);
    if (isApiRequest) return NextResponse.json({ error: 'unknown' }, { status: 500 });
    return NextResponse.redirect(`${baseUrl}/verify-email?error=unknown`);
  }
}

// POST /api/auth/verify-email — Resend verification email
export async function POST(req: NextRequest) {
  try {
    const { email, captchaToken } = await req.json();

    const captchaResult = await verifyCaptcha(captchaToken);
    if (!captchaResult.success) {
      return NextResponse.json({ error: captchaResult.error || 'Captcha verification failed' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal whether user exists (security best practice)
    // Admin never needs verification
    if (!user || user.emailVerified || user.email === 'admin@myncel.com') {
      return NextResponse.json({
        success: true,
        message: 'If an unverified account exists with this email, a new verification link has been sent.',
      });
    }

    // Delete any existing tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase() },
    });

    // Create new verification token
    const token = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    await db.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email
    const { sendVerificationEmail } = await import('@/lib/email');
    sendVerificationEmail(user.email!, token, user.name || 'User').catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'If an unverified account exists with this email, a new verification link has been sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}