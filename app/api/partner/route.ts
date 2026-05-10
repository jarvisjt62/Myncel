import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { savePublicFormSubmission } from '@/lib/form-submissions';
import { FormSubmissionType } from '@prisma/client';

export const dynamic = 'force-dynamic';

type PartnerApplicationBody = {
  name?: string;
  email?: string;
  company?: string;
  country?: string;
  partnerType?: string;
  message?: string;
  captchaToken?: string;
};

const allowedPartnerTypes = new Set([
  'Referral Partner',
  'Reseller Partner',
  'Technology Partner',
]);

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;');
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyCaptcha(captchaToken?: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    return { success: true };
  }

  if (!captchaToken) {
    return { success: false, error: 'Captcha verification is required' };
  }

  const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret,
      response: captchaToken,
    }),
  });

  const captchaData = await captchaRes.json();

  if (!captchaData.success || captchaData.score < 0.5) {
    return { success: false, error: 'Captcha verification failed' };
  }

  if (captchaData.action && captchaData.action !== 'partner_application') {
    return { success: false, error: 'Captcha action mismatch' };
  }

  return { success: true };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PartnerApplicationBody;
    const name = body.name?.trim() || '';
    const email = body.email?.trim().toLowerCase() || '';
    const company = body.company?.trim() || '';
    const country = body.country?.trim() || '';
    const partnerType = body.partnerType?.trim() || '';
    const message = body.message?.trim() || '';

    const captchaResult = await verifyCaptcha(body.captchaToken);
    if (!captchaResult.success) {
      return NextResponse.json({ error: captchaResult.error || 'Captcha verification failed' }, { status: 400 });
    }

    if (!name || !email || !company || !country || !partnerType) {
      return NextResponse.json(
        { error: 'Name, email, company, country, and partnership type are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid business email address' }, { status: 400 });
    }

    if (!allowedPartnerTypes.has(partnerType)) {
      return NextResponse.json({ error: 'Please select a valid partnership type' }, { status: 400 });
    }

    const safe = {
      name: escapeHtml(name),
      email: escapeHtml(email),
      company: escapeHtml(company),
      country: escapeHtml(country),
      partnerType: escapeHtml(partnerType),
      message: escapeHtml(message || 'Not provided'),
    };

    const partnerRecipient = process.env.PARTNER_APPLICATION_EMAIL || 'info@myncel.com';

    const result = await sendEmail({
      to: partnerRecipient,
      subject: `New Partner Application: ${name} (${partnerType})`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#0a2540;background:#f6f9fc;margin:0;padding:20px}
    .container{max-width:640px;margin:0 auto}
    .card{background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf1;box-shadow:0 4px 24px rgba(10,37,64,0.08)}
    .header{background:linear-gradient(135deg,#635bff,#4f46e5);color:#ffffff;padding:32px}
    .header h1{margin:0;font-size:24px}
    .header p{margin:8px 0 0;opacity:0.9}
    .content{padding:32px}
    .field{margin-bottom:18px}
    .label{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#8898aa;margin-bottom:4px}
    .value{font-size:15px;color:#0a2540}
    .message{background:#f6f9fc;border:1px solid #e6ebf1;border-radius:12px;padding:16px;white-space:pre-wrap}
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>New Partner Application</h1>
        <p>A prospective partner submitted the Myncel partner program form.</p>
      </div>
      <div class="content">
        <div class="field"><div class="label">Name</div><div class="value">${safe.name}</div></div>
        <div class="field"><div class="label">Email</div><div class="value">${safe.email}</div></div>
        <div class="field"><div class="label">Company</div><div class="value">${safe.company}</div></div>
        <div class="field"><div class="label">Country</div><div class="value">${safe.country}</div></div>
        <div class="field"><div class="label">Partnership Type</div><div class="value">${safe.partnerType}</div></div>
        <div class="field">
          <div class="label">Business and Clients</div>
          <div class="message">${safe.message}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    });

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to submit partner application' }, { status: 500 });
    }

    await savePublicFormSubmission({
      type: FormSubmissionType.PARTNER,
      name,
      email,
      company,
      subject: partnerType,
      source: 'Partners page',
      recipient: partnerRecipient,
      payload: {
        name,
        email,
        company,
        country,
        partnerType,
        message,
      },
    });

    return NextResponse.json({ success: true, message: 'Partner application submitted successfully' });
  } catch (error) {
    console.error('Partner application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}