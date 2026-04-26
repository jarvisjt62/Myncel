import { Resend } from 'resend';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const EMAIL_ADDRESSES = {
  admin: 'admin@myncel.com',
  support: 'support@myncel.com',
  info: 'info@myncel.com',
  contact: 'contact@myncel.com',
};

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from = EMAIL_ADDRESSES.support }: EmailPayload) {
  // If no Resend client, log and return success (for development)
  if (!resend) {
    console.log('📧 Email not sent (no RESEND_API_KEY configured):', { to, subject, from });
    return { success: true, data: { id: 'dev-mode' } };
  }

  try {
    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) { console.error('Email error:', error); return { success: false, error }; }
    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

export function getContactFormEmail(data: { name: string; email: string; company: string; size: string; message: string }) {
  return {
    to: EMAIL_ADDRESSES.contact,
    from: EMAIL_ADDRESSES.support,
    subject: `New Contact Form Submission from ${data.name}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#635bff,#4f46e5);color:white;padding:30px;border-radius:12px 12px 0 0}.content{background:#f9fafb;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb}.field{margin-bottom:20px}.label{font-weight:600;color:#374151;font-size:14px;text-transform:uppercase}.value{margin-top:5px;color:#1f2937}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:24px">New Contact Form Submission</h1><p style="margin:10px 0 0;opacity:0.9">Someone is interested in Myncel</p></div><div class="content"><div class="field"><div class="label">Name</div><div class="value">${data.name}</div></div><div class="field"><div class="label">Email</div><div class="value">${data.email}</div></div><div class="field"><div class="label">Company</div><div class="value">${data.company || 'Not provided'}</div></div><div class="field"><div class="label">Message</div><div class="value">${data.message}</div></div></div></div></body></html>`,
  };
}

export function getSupportTicketEmail(data: { name: string; email: string; subject: string; priority: string; category: string; message: string }) {
  return {
    to: EMAIL_ADDRESSES.support,
    from: EMAIL_ADDRESSES.support,
    subject: `[${data.priority}] Support Ticket: ${data.subject}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#10b981,#059669);color:white;padding:30px;border-radius:12px 12px 0 0}.content{background:#f9fafb;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb}.field{margin-bottom:20px}.label{font-weight:600;color:#374151;font-size:14px;text-transform:uppercase}.value{margin-top:5px;color:#1f2937}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:24px">New Support Ticket</h1><p style="margin:10px 0 0;opacity:0.9">Priority: ${data.priority}</p></div><div class="content"><div class="field"><div class="label">Name</div><div class="value">${data.name}</div></div><div class="field"><div class="label">Email</div><div class="value">${data.email}</div></div><div class="field"><div class="label">Category</div><div class="value">${data.category}</div></div><div class="field"><div class="label">Subject</div><div class="value">${data.subject}</div></div><div class="field"><div class="label">Message</div><div class="value">${data.message}</div></div></div></div></body></html>`,
  };
}

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const url = `${process.env.NEXTAUTH_URL || 'https://myncel.com'}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Reset Your Myncel Password',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#635bff,#4f46e5);color:white;padding:40px 30px;border-radius:12px 12px 0 0;text-align:center}.content{background:#fff;padding:40px 30px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;text-align:center}.button{display:inline-block;background:#635bff;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:28px">Reset Your Password</h1><p style="margin:10px 0 0;opacity:0.9">We received a request to reset your password</p></div><div class="content"><p>Hi ${name},</p><p>Click the button below to create a new password.</p><a href="${url}" class="button">Reset Password</a><p style="color:#6b7280;font-size:14px">This link expires in 1 hour.</p></div></div></body></html>`,
  });
}

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const url = `${process.env.NEXTAUTH_URL || 'https://myncel.com'}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Verify Your Myncel Account',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#635bff,#4f46e5);color:white;padding:40px 30px;border-radius:12px 12px 0 0;text-align:center}.content{background:#fff;padding:40px 30px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;text-align:center}.button{display:inline-block;background:#635bff;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:28px">Welcome to Myncel!</h1></div><div class="content"><p>Hi ${name},</p><p>Please verify your email address.</p><a href="${url}" class="button">Verify Email</a></div></div></body></html>`,
  });
}

export async function sendWelcomeEmail(email: string, name: string, orgName: string) {
  return sendEmail({
    to: email,
    subject: `Welcome to Myncel, ${name}!`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#635bff,#4f46e5);color:white;padding:50px 30px;border-radius:12px 12px 0 0;text-align:center}.content{background:#fff;padding:40px 30px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb}.button{display:inline-block;background:#635bff;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:32px">Welcome to Myncel!</h1></div><div class="content"><p>Hi ${name},</p><p>Thanks for creating your account for ${orgName}!</p><a href="${process.env.NEXTAUTH_URL || 'https://myncel.com'}/dashboard" class="button">Go to Dashboard</a><p>You have 90 days free. Cheers, The Myncel Team</p></div></div></body></html>`,
  });
}

export { EMAIL_ADDRESSES };