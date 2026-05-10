import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { dispatchNotifications } from '@/lib/notifications/dispatch';
import { sendEmail, sendAlertNotificationEmail, sendWorkOrderAssignedEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/test
 * Test endpoint to manually trigger notifications
 * 
 * Body: { 
 *   type: 'work_order' | 'alert' | 'pm_overdue' | 'email_only',
 *   email?: string  // for email_only type, specify recipient
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId as string | undefined;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await req.json();
    const type = body.type || 'work_order';
    const testEmail = body.email || session.user.email;

    // Get notification settings
    const settings = await safeQuery(
      db.notificationSetting.findFirst({
        where: { organizationId: orgId },
      }),
      null
    );

    // Get users in organization
    const users = await safeQuery(
      db.user.findMany({
        where: {
          organizationId: orgId,
          emailVerified: { not: null },
        },
        select: {
          email: true,
          name: true,
        },
      }),
      []
    );

    const results: any = {
      organizationId: orgId,
      settings: settings ? {
        emailWorkOrders: settings.emailWorkOrders,
        emailAlerts: settings.emailAlerts,
        emailReports: settings.emailReports,
        smsEnabled: settings.smsEnabled,
        slackEnabled: settings.slackEnabled,
      } : null,
      usersWithVerifiedEmail: users.length,
      testType: type,
    };

    if (type === 'email_only') {
      // Just send a test email directly
      console.log('📧 Sending test email to:', testEmail);
      
      const emailResult = await sendEmail({
        to: testEmail,
        subject: '[TEST] Myncel Notification Test',
        html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,sans-serif;line-height:1.6;color:#0a2540;background:#f6f9fc;margin:0;padding:20px}
.container{max-width:580px;margin:0 auto}
.card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
.header{background:linear-gradient(135deg,#635bff 0%,#4f46e5 100%);padding:32px 36px}
.header h1{color:#fff;margin:0;font-size:22px}
.body{padding:32px 36px}
.cta{display:block;background:#635bff;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;text-align:center;margin:24px 0}
.footer{text-align:center;padding:16px;font-size:13px;color:#8898aa;border-top:1px solid #e6ebf1}
</style></head>
<body><div class="container"><div class="card">
<div class="header"><h1>✅ Test Email Successful</h1></div>
<div class="body">
<p>Hi ${session.user.name || 'there'},</p>
<p>This is a test email from Myncel. If you're seeing this, your email notifications are working correctly!</p>
<p><strong>Test Details:</strong></p>
<ul>
<li>Sent at: ${new Date().toISOString()}</li>
<li>Organization ID: ${orgId}</li>
<li>Email Settings: ${settings ? 'Configured' : 'Not found'}</li>
</ul>
<a href="${process.env.NEXTAUTH_URL || 'https://myncel.com'}/settings/notifications" class="cta">Manage Notification Settings →</a>
</div>
<div class="footer"><p>Myncel — AI-Powered Maintenance Management</p></div>
</div></div></body></html>`,
      });
      
      results.emailSent = emailResult;
      results.recipient = testEmail;
    } else if (type === 'work_order') {
      // Test work order notification
      await dispatchNotifications(orgId, {
        type: 'work_order.created',
        workOrderNumber: 'TEST-WO-001',
        title: 'Test Work Order - Notification Test',
        machineName: 'Test Machine',
        priority: 'HIGH',
      });
      results.dispatched = 'work_order.created';
    } else if (type === 'alert') {
      // Test alert notification
      await dispatchNotifications(orgId, {
        type: 'alert.triggered',
        alertTitle: 'Test Alert - Notification Test',
        machineName: 'Test Machine',
        severity: 'HIGH',
        message: 'This is a test alert to verify notifications are working.',
      });
      results.dispatched = 'alert.triggered';
    } else if (type === 'pm_overdue') {
      // Test PM overdue notification
      await dispatchNotifications(orgId, {
        type: 'pm.overdue',
        taskTitle: 'Test PM Task - Notification Test',
        machineName: 'Test Machine',
        daysOverdue: 5,
      });
      results.dispatched = 'pm.overdue';
    }

    // Check if RESEND_API_KEY is configured
    const hasResendKey = !!process.env.RESEND_API_KEY;
    results.resendConfigured = hasResendKey;
    
    if (!hasResendKey) {
      results.warning = 'RESEND_API_KEY is not configured. Emails will be logged but not sent.';
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    console.error('Notification test error:', error);
    return NextResponse.json({ 
      error: 'Failed to send test notification', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

/**
 * GET /api/notifications/test
 * Get notification settings and status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId as string | undefined;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get notification settings
    const settings = await safeQuery(
      db.notificationSetting.findFirst({
        where: { organizationId: orgId },
      }),
      null
    );

    // Get users with verified emails
    const usersWithEmails = await safeQuery(
      db.user.findMany({
        where: {
          organizationId: orgId,
          emailVerified: { not: null },
        },
        select: {
          email: true,
          name: true,
          emailVerified: true,
        },
      }),
      []
    );

    // Check environment
    const hasResendKey = !!process.env.RESEND_API_KEY;
    const resendFromAddress = process.env.EMAIL_FROM_ADDRESS || 'Myncel <support@myncel.com>';

    return NextResponse.json({
      organizationId: orgId,
      resendConfigured: hasResendKey,
      resendFromAddress,
      settings: settings ? {
        // Email settings
        emailWorkOrders: settings.emailWorkOrders,
        emailAlerts: settings.emailAlerts,
        emailReports: settings.emailReports,
        emailDigest: settings.emailDigest,
        // SMS settings
        smsEnabled: settings.smsEnabled,
        smsWorkOrders: settings.smsWorkOrders,
        smsAlerts: settings.smsAlerts,
        smsCriticalOnly: settings.smsCriticalOnly,
        phoneNumber: settings.phoneNumber,
        // Slack settings
        slackEnabled: settings.slackEnabled,
        slackWorkOrders: settings.slackWorkOrders,
        slackAlerts: settings.slackAlerts,
        slackChannel: settings.slackChannel,
      } : null,
      usersWithVerifiedEmail: usersWithEmails.length,
      userEmails: usersWithEmails.map(u => ({ email: u.email, name: u.name, verified: !!u.emailVerified })),
      recommendation: !settings 
        ? 'No notification settings found. Create settings at /settings/notifications'
        : !hasResendKey 
          ? 'RESEND_API_KEY not configured. Set it in your environment variables.'
          : usersWithEmails.length === 0
            ? 'No users with verified emails found. Users need to verify their emails first.'
            : 'All systems ready for email notifications!',
    });
  } catch (error) {
    console.error('Notification status error:', error);
    return NextResponse.json({ 
      error: 'Failed to get notification status', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}