import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// GET /api/test-email?id=<email_id> — Check email delivery status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const response = await fetch(`https://api.resend.com/emails/${id}`, {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json({ status: response.status, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/test-email — Send a test email to diagnose delivery issues
export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json();
    
    if (!to) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'Myncel <support@myncel.com>';

    // Diagnostic info
    const diagnostics = {
      hasResendApiKey: !!RESEND_API_KEY,
      apiKeyPrefix: RESEND_API_KEY ? RESEND_API_KEY.substring(0, 6) + '...' : 'NOT SET',
      fromAddress,
      to,
      timestamp: new Date().toISOString(),
    };

    console.log('📧 Test email request:', diagnostics);

    if (!RESEND_API_KEY) {
      return NextResponse.json({
        error: 'RESEND_API_KEY is not configured in environment variables',
        diagnostics,
      }, { status: 500 });
    }

    // Try sending a simple test email
    const result = await sendEmail({
      to,
      subject: 'Myncel Test Email — Verification Diagnostic',
      html: `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;background:#f6f9fc"><div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;padding:30px;border:1px solid #e5e7eb"><h1 style="color:#0a2540;font-size:20px">✅ Test Email Received!</h1><p style="color:#425466;font-size:14px">This confirms your email delivery is working correctly.</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"><p style="color:#8898aa;font-size:12px">From: ${fromAddress}<br>To: ${to}<br>Sent: ${diagnostics.timestamp}</p></div></body></html>`,
    });

    return NextResponse.json({
      success: result.success,
      diagnostics,
      resendResult: result,
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json({
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}