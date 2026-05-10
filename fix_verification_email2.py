with open('lib/email.ts', 'r') as f:
    lines = f.readlines()

# Lines 67-74 (0-indexed: 66-73) contain the sendVerificationEmail function
# Find the function start and end
start_line = None
end_line = None

for i, line in enumerate(lines):
    if 'export async function sendVerificationEmail' in line:
        start_line = i
    if start_line is not None and i > start_line and line.strip() == '}':
        end_line = i
        break

print(f"Function found at lines {start_line+1}-{end_line+1}")
print("Current content:")
for i in range(start_line, end_line+1):
    print(f"  {i+1}: {repr(lines[i])}")

# Replace lines start_line to end_line (inclusive) with new function
new_func_lines = [
    'export async function sendVerificationEmail(email: string, token: string, name: string) {\n',
    "  const url = `${process.env.NEXTAUTH_URL || 'https://myncel.com'}/verify-email?token=${token}`;\n",
    "  const firstName = (name || 'there').split(' ')[0];\n",
    '  return sendEmail({\n',
    '    to: email,\n',
    '    subject: `Please confirm your Myncel account, ${firstName}`,\n',
    '    html: `<!DOCTYPE html>\n',
    '<html lang="en">\n',
    '<head>\n',
    '  <meta charset="utf-8">\n',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n',
    '  <title>Confirm your Myncel account</title>\n',
    '</head>\n',
    '<body style="margin:0;padding:0;background-color:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">\n',
    '  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f9fc;padding:40px 0;">\n',
    '    <tr><td align="center">\n',
    '      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">\n',
    '        <tr><td align="center" style="padding-bottom:24px;">\n',
    '          <span style="font-size:22px;font-weight:700;color:#0a2540;">Myncel</span>\n',
    '        </td></tr>\n',
    '        <tr><td style="background:#ffffff;border-radius:12px;border:1px solid #e6ebf1;padding:40px 36px;text-align:center;">\n',
    '          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0a2540;">Confirm your email address</h1>\n',
    '          <p style="margin:0 0 24px;font-size:15px;color:#425466;line-height:1.6;">Hi ${firstName}, thanks for signing up for Myncel!<br>Please click the button below to confirm your email address and activate your account.</p>\n',
    '          <a href="${url}" style="display:inline-block;background:#635bff;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;margin-bottom:24px;">Confirm Email Address</a>\n',
    '          <p style="margin:0 0 8px;font-size:13px;color:#8898aa;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>\n',
    '          <p style="margin:0;font-size:12px;color:#b0b8c4;">Or copy this link: <a href="${url}" style="color:#635bff;word-break:break-all;">${url}</a></p>\n',
    '        </td></tr>\n',
    '        <tr><td align="center" style="padding-top:24px;">\n',
    '          <p style="margin:0;font-size:12px;color:#8898aa;">Myncel - AI-Powered Maintenance Management | <a href="https://myncel.com" style="color:#8898aa;">myncel.com</a></p>\n',
    '        </td></tr>\n',
    '      </table>\n',
    '    </td></tr>\n',
    '  </table>\n',
    '</body>\n',
    '</html>`,\n',
    '  });\n',
    '}\n',
]

new_lines = lines[:start_line] + new_func_lines + lines[end_line+1:]

with open('lib/email.ts', 'w') as f:
    f.writelines(new_lines)

print(f"\n✅ Replaced function ({end_line - start_line + 1} lines → {len(new_func_lines)} lines)")