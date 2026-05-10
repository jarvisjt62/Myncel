import re

with open('lib/email.ts', 'r') as f:
    content = f.read()

old_func = '''export async function sendVerificationEmail(email: string, token: string, name: string) {
  const url = `${process.env.NEXTAUTH_URL || 'https://myncel.com'}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Verify Your Myncel Account',
    html: `<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><style>body{font-family:-apple-system,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#635bff,#4f46e5);color:white;padding:40px 30px;border-radius:12px 12px 0 0;text-align:center}.content{background:#fff;padding:40px 30px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;text-align:center}.button{display:inline-block;background:#635bff;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0}</style></head><body><div class=\\"container\\"><div class=\\"header\\"><h1 style=\\"margin:0;font-size:28px\\">Welcome to Myncel!</h1></div><div class=\\"content\\"><p>Hi ${name},</p><p>Please verify your email address.</p><a href=\\"${url}\\" class=\\"button\\">Verify Email</a></div></div></body></html>`,
  });
}'''

new_func = r'''export async function sendVerificationEmail(email: string, token: string, name: string) {
  const url = `${process.env.NEXTAUTH_URL || 'https://myncel.com'}/verify-email?token=${token}`;
  const firstName = name?.split(' ')[0] || 'there';
  return sendEmail({
    to: email,
    subject: `Please confirm your Myncel account, ${firstName}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your Myncel account</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f9fc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:22px;font-weight:700;color:#0a2540;">Myncel</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:12px;border:1px solid #e6ebf1;padding:40px 36px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0a2540;">Confirm your email address</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#425466;line-height:1.6;">
                Hi ${firstName}, thanks for signing up for Myncel!<br>
                Please click the button below to confirm your email address and activate your account.
              </p>
              <a href="${url}" style="display:inline-block;background:#635bff;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;margin-bottom:24px;">
                Confirm Email Address
              </a>
              <p style="margin:0 0 8px;font-size:13px;color:#8898aa;">
                This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
              </p>
              <p style="margin:0;font-size:12px;color:#b0b8c4;">
                Or copy this link: <a href="${url}" style="color:#635bff;word-break:break-all;">${url}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#8898aa;">
                Myncel - AI-Powered Maintenance Management<br>
                <a href="https://myncel.com" style="color:#8898aa;">myncel.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}'''

if old_func in content:
    new_content = content.replace(old_func, new_func)
    with open('lib/email.ts', 'w') as f:
        f.write(new_content)
    print("✅ Successfully replaced sendVerificationEmail function")
else:
    print("❌ Could not find the function to replace")
    # Show what's at line 67
    lines = content.split('\n')
    for i, line in enumerate(lines[65:75], start=66):
        print(f"Line {i}: {repr(line)}")