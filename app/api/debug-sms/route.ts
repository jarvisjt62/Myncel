import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { sendSmsNotification, workOrderSmsMessage } from '@/lib/notifications/sms';

export const dynamic = 'force-dynamic';

/**
 * Comprehensive SMS diagnostic endpoint.
 * Tells you EXACTLY why SMS isn't being sent for the current user's org.
 *
 * GET /api/debug-sms        -> diagnose state (no side effects)
 * POST /api/debug-sms       -> diagnose + send a test SMS to the org's phone number
 * POST /api/debug-sms { fix: true }  -> auto-fix common issues (enable smsEnabled etc.)
 */
export async function GET(req: NextRequest) {
  return runDiagnostic(false, false);
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const shouldSend = !!body.sendTest;
  const shouldFix = !!body.fix;
  return runDiagnostic(shouldSend, shouldFix);
}

async function runDiagnostic(sendTest: boolean, fix: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report: any = {
      user: { email: session.user.email },
      checks: {},
      diagnosis: [] as string[],
      actions: [] as string[],
    };

    // Step 1: Get user's org
    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, organizationId: true, role: true, email: true },
      }),
      null
    );

    if (!user?.organizationId) {
      report.diagnosis.push('❌ User has no organizationId');
      return NextResponse.json(report);
    }

    report.user = { ...report.user, id: user.id, organizationId: user.organizationId, role: user.role };

    // Step 2: Find the admin (platform) org
    const adminUser = await safeQuery(
      db.user.findFirst({
        where: { email: 'admin@myncel.com' },
        select: { organizationId: true },
      }),
      null
    );
    const adminOrgId = adminUser?.organizationId;
    report.checks.adminOrgId = adminOrgId;
    report.checks.isAdminOrg = user.organizationId === adminOrgId;

    // Step 3: Check the org's own NotificationSetting
    const settings = await safeQuery(
      db.notificationSetting.findUnique({
        where: { organizationId: user.organizationId },
      }),
      null
    );

    report.checks.notificationSetting = settings ? {
      exists: true,
      smsEnabled: settings.smsEnabled,
      smsWorkOrders: settings.smsWorkOrders,
      smsAlerts: settings.smsAlerts,
      smsCriticalOnly: settings.smsCriticalOnly,
      phoneNumber: settings.phoneNumber,
      emailWorkOrders: settings.emailWorkOrders,
    } : { exists: false };

    if (!settings) {
      report.diagnosis.push('❌ No NotificationSetting row exists for this org. When a work order is created, dispatchNotifications() will try to auto-create one — but only if platform Twilio is connected.');
    } else {
      if (!settings.smsEnabled) report.diagnosis.push('❌ smsEnabled is FALSE — dispatchNotifications() skips the entire SMS branch.');
      if (!settings.smsWorkOrders) report.diagnosis.push('❌ smsWorkOrders is FALSE — work order SMS won\'t be sent even if smsEnabled is true.');
      if (!settings.phoneNumber) report.diagnosis.push('❌ phoneNumber is EMPTY — SMS has no destination. Must be set in Settings → Notifications.');
    }

    // Step 4: Check the org's own Twilio integration
    const orgTwilio = await safeQuery(
      db.integration.findFirst({
        where: { organizationId: user.organizationId, type: 'TWILIO' },
      }),
      null
    );
    report.checks.orgTwilio = orgTwilio ? {
      exists: true,
      status: orgTwilio.status,
      hasConfig: !!orgTwilio.config,
      hasCredentials: !!(orgTwilio.config && (orgTwilio.config as any).accountSid && (orgTwilio.config as any).authToken),
      fromNumber: (orgTwilio.config as any)?.fromNumber || null,
    } : { exists: false };

    // Step 5: Check the admin (platform) Twilio integration
    let adminTwilio: any = null;
    if (adminOrgId) {
      adminTwilio = await safeQuery(
        db.integration.findFirst({
          where: { organizationId: adminOrgId, type: 'TWILIO' },
        }),
        null
      );
    }
    report.checks.adminTwilio = adminTwilio ? {
      exists: true,
      status: adminTwilio.status,
      hasConfig: !!adminTwilio.config,
      hasCredentials: !!(adminTwilio.config && (adminTwilio.config as any).accountSid && (adminTwilio.config as any).authToken),
      fromNumber: (adminTwilio.config as any)?.fromNumber || null,
      accountSidPrefix: (adminTwilio.config as any)?.accountSid?.substring(0, 8) + '...' || null,
    } : { exists: false };

    if (!adminTwilio || adminTwilio.status !== 'CONNECTED') {
      report.diagnosis.push(`❌ Platform (admin) Twilio is ${adminTwilio ? 'status=' + adminTwilio.status : 'NOT CREATED'}. SMS won't work until admin@myncel.com connects Twilio with status=CONNECTED.`);
    } else if (!adminTwilio.config || !(adminTwilio.config as any).accountSid || !(adminTwilio.config as any).authToken || !(adminTwilio.config as any).fromNumber) {
      report.diagnosis.push('❌ Platform Twilio exists but config is missing accountSid/authToken/fromNumber.');
    }

    // Step 6: Which Twilio would sendSmsNotification use?
    // A platformManaged record (no credentials of its own) is treated as "not the org's own" —
    // the SMS module falls through to the admin's record.
    const orgConfig = orgTwilio?.config as Record<string, any> | null;
    const orgHasOwnCredentials = orgTwilio?.status === 'CONNECTED' && orgConfig?.accountSid && orgConfig?.authToken && !orgConfig?.platformManaged;
    const effectiveTwilio = orgHasOwnCredentials ? 'org' :
                            (adminTwilio && adminTwilio.status === 'CONNECTED') ? 'platform (admin fallback)' :
                            'NONE';
    report.checks.effectiveTwilio = effectiveTwilio;

    // Step 7: Optional auto-fix
    if (fix) {
      if (adminTwilio && adminTwilio.status === 'CONNECTED') {
        // Enable SMS flags for this org
        const updated = await safeQuery(
          db.notificationSetting.upsert({
            where: { organizationId: user.organizationId },
            create: {
              organizationId: user.organizationId,
              smsEnabled: true,
              smsWorkOrders: true,
              smsAlerts: true,
            },
            update: {
              smsEnabled: true,
              smsWorkOrders: true,
              smsAlerts: true,
            },
          }),
          null
        );
        report.actions.push('✅ Set smsEnabled=true, smsWorkOrders=true, smsAlerts=true');
        report.checks.notificationSettingAfterFix = updated ? {
          smsEnabled: updated.smsEnabled,
          smsWorkOrders: updated.smsWorkOrders,
          smsAlerts: updated.smsAlerts,
          phoneNumber: updated.phoneNumber,
        } : null;
        if (!updated?.phoneNumber) {
          report.actions.push('⚠️  Phone number is still empty — user must enter it in Settings → Notifications → Mobile Phone Number.');
        }
      } else {
        report.actions.push('❌ Cannot fix: platform Twilio is not CONNECTED. Ask admin@myncel.com to set it up.');
      }
    }

    // Step 8: Optional send test
    if (sendTest) {
      const toNumber = settings?.phoneNumber;
      if (!toNumber) {
        report.actions.push('❌ Cannot send test SMS: no phoneNumber set in notification settings.');
      } else if (effectiveTwilio === 'NONE') {
        report.actions.push('❌ Cannot send test SMS: no Twilio integration available.');
      } else {
        const message = workOrderSmsMessage({
          workOrderNumber: 'TEST-0001',
          title: 'Diagnostic Test SMS',
          machineName: 'Test Machine',
          priority: 'HIGH',
        });
        const result = await sendSmsNotification(user.organizationId, toNumber, message);
        report.actions.push(result.success
          ? `✅ Test SMS sent successfully to ${toNumber} (sid=${result.sid})`
          : `❌ Test SMS failed: ${result.error}`);
        report.testResult = result;
      }
    }

    // Final summary
    const readyToSendSms = !!(
      settings?.smsEnabled &&
      settings?.smsWorkOrders &&
      settings?.phoneNumber &&
      effectiveTwilio !== 'NONE'
    );
    report.summary = {
      readyToSendSms,
      blockers: [] as string[],
    };
    if (!settings?.smsEnabled) report.summary.blockers.push('smsEnabled=false');
    if (!settings?.smsWorkOrders) report.summary.blockers.push('smsWorkOrders=false');
    if (!settings?.phoneNumber) report.summary.blockers.push('phoneNumber=empty');
    if (effectiveTwilio === 'NONE') report.summary.blockers.push('no Twilio integration');

    if (readyToSendSms) {
      report.diagnosis.push('✅ All conditions met — SMS should be sent when a work order is created.');
    }

    return NextResponse.json(report, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || 'Unknown error',
      stack: error?.stack,
    }, { status: 500 });
  }
}
