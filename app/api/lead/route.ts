import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, company, source, captchaToken } = body

    // Verify reCAPTCHA
    if (process.env.RECAPTCHA_SECRET_KEY && captchaToken) {
      const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      })
      const captchaData = await captchaRes.json()
      if (!captchaData.success || captchaData.score < 0.5) {
        return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 })
      }
    }

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Send notification email
    await sendEmail({
      to: 'info@myncel.com',
      subject: `New Lead: ${name} downloaded ${source}`,
      html: `
        <h2>New Lead from ${source}</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        <p><strong>Source:</strong> ${source}</p>
      `,
    })

    // Send download email to user
    await sendEmail({
      to: email,
      subject: 'Your Free PM Checklist is Here!',
      from: 'info@myncel.com',
      html: `
        <h2>Hi ${name},</h2>
        <p>Thanks for downloading our Preventive Maintenance Checklist!</p>
        <p>You can download your checklist here: <a href="https://myncel.com/guides/pm-checklist?download=true">Download Checklist</a></p>
        <p>This checklist covers:</p>
        <ul>
          <li>CNC Mills & Machining Centers</li>
          <li>CNC Lathes & Turning Centers</li>
          <li>Hydraulic Presses & Systems</li>
          <li>Air Compressors & Pneumatics</li>
          <li>Conveyors & Material Handling</li>
          <li>Electrical Panels & Motors</li>
          <li>Cooling & HVAC Systems</li>
          <li>Welding Equipment</li>
        </ul>
        <p>If you're looking to streamline your maintenance operations, consider trying <a href="https://myncel.com/signup">Myncel free for 3 months</a>.</p>
        <p>Best,<br>The Myncel Team</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead submission error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}