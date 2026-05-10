import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// GET /api/debug-email — List recent emails from Resend + check suppression
export async function GET(req: NextRequest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  try {
    // Fetch last 25 emails from Resend
    const listRes = await fetch('https://api.resend.com/emails?limit=25', {
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` },
    });
    const listData = await listRes.json();

    // Filter by email if provided
    let emails = listData?.data || [];
    if (email) {
      emails = emails.filter((e: any) =>
        (Array.isArray(e.to) ? e.to.join(',') : e.to || '').toLowerCase().includes(email.toLowerCase())
      );
    }

    // Check suppression for the email
    let suppressionData = null;
    if (email) {
      const suppRes = await fetch(`https://api.resend.com/suppressions/${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` },
      });
      suppressionData = await suppRes.json();
    }

    return NextResponse.json({
      totalFetched: listData?.data?.length || 0,
      matchingEmails: emails.length,
      emails: emails.map((e: any) => ({
        id: e.id,
        to: e.to,
        subject: e.subject,
        from: e.from,
        created_at: e.created_at,
        last_event: e.last_event,
      })),
      suppression: suppressionData,
      env: {
        hasApiKey: !!RESEND_API_KEY,
        apiKeyPrefix: RESEND_API_KEY.substring(0, 8) + '...',
        nextauthUrl: process.env.NEXTAUTH_URL || '(not set)',
        emailFrom: process.env.EMAIL_FROM_ADDRESS || '(not set — default used)',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/debug-email — Simulate sending a verification email exactly like registration does
export async function POST(req: NextRequest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { email, name } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const testToken = `debugtest${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'https://www.myncel.com'}/verify-email?token=${testToken}`;

    console.log('🔍 Debug email test:', { email, name, verificationUrl });

    const result = await sendVerificationEmail(email, testToken, name || 'Test User');

    return NextResponse.json({
      success: result.success,
      emailId: (result.data as any)?.id,
      error: result.error,
      verificationUrl,
      env: {
        nextauthUrl: process.env.NEXTAUTH_URL || '(not set)',
        emailFrom: process.env.EMAIL_FROM_ADDRESS || '(not set)',
        hasApiKey: !!RESEND_API_KEY,
        apiKeyPrefix: RESEND_API_KEY.substring(0, 8) + '...',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}