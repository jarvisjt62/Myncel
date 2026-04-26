import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getSupportTicketEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, priority, category, message, captchaToken } = body;

    // Verify reCAPTCHA
    if (process.env.RECAPTCHA_SECRET_KEY && captchaToken) {
      const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      });
      const captchaData = await captchaRes.json();
      if (!captchaData.success || captchaData.score < 0.5) {
        return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 });
      }
    }

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Name, email, subject, and message are required' }, { status: 400 });
    }

    // Send email
    const emailData = getSupportTicketEmail({ 
      name, 
      email, 
      subject, 
      priority: priority || 'Normal', 
      category: category || 'Other', 
      message 
    });
    const result = await sendEmail(emailData);

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to submit ticket' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Ticket submitted successfully' });
  } catch (error) {
    console.error('Support ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}