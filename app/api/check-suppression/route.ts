import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/check-suppression?email=xxx — Check if email is on Resend suppression list
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    // Check suppression list
    const response = await fetch(`https://api.resend.com/suppressions/${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // Also check recent emails to this address
    const emailsResponse = await fetch(`https://api.resend.com/emails?limit=10`, {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    const emailsData = await emailsResponse.json();

    // Filter emails sent to this address
    const emailsToAddress = emailsData?.data?.filter((e: any) => 
      e.to?.includes(email)
    ) || [];

    return NextResponse.json({
      suppressionStatus: response.status,
      suppressionData: data,
      recentEmails: emailsToAddress.map((e: any) => ({
        id: e.id,
        subject: e.subject,
        last_event: e.last_event,
        created_at: e.created_at,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}