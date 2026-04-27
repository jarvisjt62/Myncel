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

export async function sendTeamInviteEmail(
  email: string,
  token: string,
  inviterName: string,
  orgName: string,
  role: string
) {
  const url = `${process.env.NEXTAUTH_URL || 'https://myncel.com'}/join/${token}`;
  const roleLabel = role === 'TECHNICIAN' ? 'Technician' : role === 'ADMIN' ? 'Admin' : role === 'MEMBER' ? 'Member' : role;
  return sendEmail({
    to: email,
    subject: `You've been invited to join ${orgName} on Myncel`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#0a2540;background:#f6f9fc;margin:0;padding:20px}
      .container{max-width:580px;margin:0 auto}
      .card{background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
      .header{background:linear-gradient(135deg,#635bff 0%,#4f46e5 100%);padding:40px 36px;text-align:center}
      .header h1{color:#fff;margin:0;font-size:26px;font-weight:700}
      .header p{color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px}
      .body{padding:36px}
      .role-badge{display:inline-block;background:rgba(99,91,255,0.1);color:#635bff;border:1px solid rgba(99,91,255,0.3);padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;margin:4px 0 20px}
      .cta{display:block;background:#635bff;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:10px;font-weight:700;font-size:16px;text-align:center;margin:24px 0}
      .cta:hover{background:#4f46e5}
      .details{background:#f6f9fc;border-radius:10px;padding:16px 20px;margin:20px 0;font-size:14px}
      .details p{margin:4px 0;color:#425466}
      .details strong{color:#0a2540}
      .footer{text-align:center;padding:20px 36px;font-size:13px;color:#8898aa;border-top:1px solid #e6ebf1}
      .expires{font-size:13px;color:#8898aa;text-align:center;margin-top:8px}
    </style></head>
    <body><div class="container"><div class="card">
      <div class="header">
        <h1>🔧 You're Invited to Myncel</h1>
        <p>${inviterName} has invited you to join their team</p>
      </div>
      <div class="body">
        <p>Hi there,</p>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on Myncel as a:</p>
        <span class="role-badge">${roleLabel}</span>
        <div class="details">
          <p><strong>Organization:</strong> ${orgName}</p>
          <p><strong>Your Role:</strong> ${roleLabel}</p>
          <p><strong>Invited by:</strong> ${inviterName}</p>
        </div>
        <p>Click the button below to set up your account and get started. The link expires in <strong>48 hours</strong>.</p>
        <a href="${url}" class="cta">Accept Invitation & Join Team</a>
        <p class="expires">Or copy this link: <a href="${url}" style="color:#635bff">${url}</a></p>
      </div>
      <div class="footer">
        <p>Myncel — AI-Powered Maintenance Management</p>
        <p>If you weren't expecting this invite, you can safely ignore this email.</p>
      </div>
    </div></div></body></html>`,
  });
}

export async function sendWorkOrderAssignedEmail(
  email: string,
  technicianName: string,
  woTitle: string,
  woNumber: string,
  machineName: string,
  priority: string,
  dueAt: Date | null,
  assignedByName: string
) {
  const url = `${process.env.NEXTAUTH_URL || 'https://myncel.com'}/dashboard`;
  const priorityColors: Record<string, string> = {
    CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#635bff', LOW: '#10b981',
  };
  const color = priorityColors[priority] || '#635bff';
  return sendEmail({
    to: email,
    subject: `[${priority}] Work Order Assigned: ${woTitle}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#0a2540;background:#f6f9fc;margin:0;padding:20px}
      .container{max-width:580px;margin:0 auto}
      .card{background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
      .header{background:linear-gradient(135deg,#0a2540 0%,#1e3a5f 100%);padding:32px 36px}
      .header h1{color:#fff;margin:0;font-size:22px;font-weight:700}
      .header p{color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px}
      .priority{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;color:#fff;background:${color};margin-top:8px}
      .body{padding:32px 36px}
      .wo-card{background:#f6f9fc;border-left:4px solid ${color};border-radius:0 10px 10px 0;padding:16px 20px;margin:16px 0}
      .wo-card .label{font-size:11px;font-weight:600;text-transform:uppercase;color:#8898aa;margin-bottom:2px}
      .wo-card .value{font-size:15px;font-weight:600;color:#0a2540}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
      .grid-item{background:#f6f9fc;border-radius:8px;padding:12px 14px}
      .grid-item .label{font-size:11px;color:#8898aa;font-weight:600;text-transform:uppercase}
      .grid-item .value{font-size:14px;color:#0a2540;font-weight:600;margin-top:2px}
      .cta{display:block;background:#635bff;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;text-align:center;margin:24px 0}
      .footer{text-align:center;padding:16px 36px;font-size:13px;color:#8898aa;border-top:1px solid #e6ebf1}
    </style></head>
    <body><div class="container"><div class="card">
      <div class="header">
        <h1>📋 New Work Order Assigned</h1>
        <p>You have a new maintenance task</p>
        <span class="priority">${priority}</span>
      </div>
      <div class="body">
        <p>Hi ${technicianName},</p>
        <p>A new work order has been assigned to you by <strong>${assignedByName}</strong>:</p>
        <div class="wo-card">
          <div class="label">Work Order</div>
          <div class="value">${woNumber} — ${woTitle}</div>
        </div>
        <div class="grid">
          <div class="grid-item"><div class="label">Machine</div><div class="value">${machineName}</div></div>
          <div class="grid-item"><div class="label">Priority</div><div class="value" style="color:${color}">${priority}</div></div>
          <div class="grid-item"><div class="label">Due Date</div><div class="value">${dueAt ? new Date(dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'}</div></div>
          <div class="grid-item"><div class="label">Assigned By</div><div class="value">${assignedByName}</div></div>
        </div>
        <a href="${url}" class="cta">View Work Order in Dashboard →</a>
      </div>
      <div class="footer"><p>Myncel — AI-Powered Maintenance Management</p></div>
    </div></div></body></html>`,
  });
}

export async function sendAlertNotificationEmail(
  email: string,
  recipientName: string,
  alertTitle: string,
  alertMessage: string,
  severity: string,
  machineName: string
) {
  const url = `${process.env.NEXTAUTH_URL || 'https://myncel.com'}/dashboard`;
  const severityColors: Record<string, string> = {
    CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#635bff', LOW: '#10b981',
  };
  const color = severityColors[severity] || '#635bff';
  return sendEmail({
    to: email,
    subject: `[${severity}] Alert: ${alertTitle}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,sans-serif;line-height:1.6;color:#0a2540;background:#f6f9fc;margin:0;padding:20px}
      .container{max-width:580px;margin:0 auto}
      .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
      .header{background:${color};padding:32px 36px}
      .header h1{color:#fff;margin:0;font-size:22px}
      .header p{color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px}
      .body{padding:32px 36px}
      .alert-box{background:#fff8f8;border:1px solid ${color}33;border-left:4px solid ${color};border-radius:0 10px 10px 0;padding:16px 20px;margin:16px 0}
      .cta{display:block;background:#635bff;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;text-align:center;margin:24px 0}
      .footer{text-align:center;padding:16px;font-size:13px;color:#8898aa;border-top:1px solid #e6ebf1}
    </style></head>
    <body><div class="container"><div class="card">
      <div class="header">
        <h1>⚠️ Machine Alert — ${severity}</h1>
        <p>${machineName}</p>
      </div>
      <div class="body">
        <p>Hi ${recipientName},</p>
        <p>A <strong>${severity}</strong> alert has been triggered:</p>
        <div class="alert-box">
          <strong>${alertTitle}</strong>
          <p style="margin:8px 0 0;color:#425466">${alertMessage}</p>
        </div>
        <a href="${url}" class="cta">View in Dashboard →</a>
      </div>
      <div class="footer"><p>Myncel — AI-Powered Maintenance Management</p></div>
    </div></div></body></html>`,
  });
}

export { EMAIL_ADDRESSES };