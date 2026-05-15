/**
 * SMS notification dispatcher using Twilio
 * Sends SMS messages via the Twilio REST API
 */

import { db, safeQuery } from '@/lib/db';

export async function sendSmsNotification(
  organizationId: string,
  toNumber: string,
  message: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  const logPrefix = `[sms] org=${organizationId} to=${toNumber}`;
  try {
    // Fetch Twilio integration config — first check org, then fall back to platform (admin) config.
    // If the org's record is platform-managed (config.platformManaged = true), it has no credentials
    // of its own — skip it and fall through to the admin's record.
    let integration: any = null;
    const orgIntegration = await safeQuery(
      db.integration.findFirst({
        where: {
          organizationId,
          type: 'TWILIO',
          status: 'CONNECTED',
        },
      }),
      null
    );

    const orgConfig = orgIntegration?.config as Record<string, any> | null;
    const isPlatformManaged = orgConfig?.platformManaged === true;

    if (orgIntegration && !isPlatformManaged) {
      integration = orgIntegration;
      console.log(`${logPrefix} using org's own Twilio integration`);
    }

    // If org doesn't have its own Twilio credentials (or only has a platformManaged record),
    // check the platform-level (admin) integration
    if (!integration) {
      const adminUser = await safeQuery(
        db.user.findFirst({
          where: { email: 'admin@myncel.com' },
          select: { organizationId: true },
        }),
        null
      );

      if (adminUser?.organizationId) {
        integration = await safeQuery(
          db.integration.findFirst({
            where: {
              organizationId: adminUser.organizationId,
              type: 'TWILIO',
              status: 'CONNECTED',
            },
          }),
          null
        );
        if (integration) {
          console.log(`${logPrefix} falling back to platform (admin) Twilio integration`);
        }
      }
    }

    if (!integration) {
      console.error(`${logPrefix} NO Twilio integration found (neither org nor platform)`);
      return { success: false, error: 'SMS integration not connected' };
    }

    const config = integration.config as Record<string, any> | null;
    if (!config?.accountSid || !config?.authToken || !config?.fromNumber) {
      console.error(`${logPrefix} Twilio config incomplete: accountSid=${!!config?.accountSid} authToken=${!!config?.authToken} fromNumber=${!!config?.fromNumber}`);
      return { success: false, error: 'Twilio configuration incomplete' };
    }

    const { accountSid, authToken, fromNumber } = config;

    // Allow multi-segment SMS up to 1600 chars (Twilio auto-splits into 160-char segments).
    // A single GSM-7 SMS is 160 chars; with a URL included we typically use 2 segments max.
    const truncatedMessage = message.length > 1600 ? message.slice(0, 1597) + '…' : message;

    console.log(`${logPrefix} calling Twilio API from=${fromNumber} sid=${accountSid.substring(0, 8)}...`);

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: toNumber,
          Body: truncatedMessage,
        }),
      }
    );

    const data = await res.json();

    if (res.ok && data.sid) {
      console.log(`${logPrefix} Twilio SUCCESS sid=${data.sid}`);
      return { success: true, sid: data.sid };
    } else {
      console.error(`${logPrefix} Twilio API error status=${res.status}:`, data);
      return { success: false, error: data.message || `Twilio send failed (status ${res.status})` };
    }
  } catch (err) {
    console.error(`${logPrefix} exception:`, err);
    return { success: false, error: String(err) };
  }
}

/**
 * Send SMS to the organization's configured phone number.
 * The caller (dispatch.ts) is responsible for checking whether SMS should be
 * sent for this event type and severity. This function only verifies that
 * SMS is enabled and a phone number is configured.
 */
export async function broadcastSms(
  organizationId: string,
  message: string,
  _criticalOnly = false // kept for backwards compatibility; caller handles filtering
): Promise<{ sent: number; failed: number }> {
  const logPrefix = `[broadcastSms] org=${organizationId}`;
  let sent = 0;
  let failed = 0;

  try {
    // Get notification settings for the org
    const settings = await safeQuery(
      db.notificationSetting.findFirst({
        where: { organizationId },
      }),
      null
    );

    if (!settings?.smsEnabled) {
      console.log(`${logPrefix} SKIP: smsEnabled=${settings?.smsEnabled}`);
      return { sent: 0, failed: 0 };
    }

    const phoneNumber = settings.phoneNumber;
    if (!phoneNumber) {
      console.log(`${logPrefix} SKIP: phoneNumber empty`);
      return { sent: 0, failed: 0 };
    }

    console.log(`${logPrefix} sending to ${phoneNumber}`);
    const result = await sendSmsNotification(organizationId, phoneNumber, message);
    if (result.success) {
      sent++;
      console.log(`${logPrefix} SUCCESS sid=${result.sid}`);
    } else {
      failed++;
      console.error(`${logPrefix} FAILED: ${result.error}`);
    }
  } catch (err) {
    console.error(`${logPrefix} exception:`, err);
    failed++;
  }

  return { sent, failed };
}

// ── Pre-built SMS message formatters ───────────────────────────

export function workOrderSmsMessage(opts: {
  workOrderNumber: string;
  title: string;
  machineName: string;
  priority: string;
  orgName?: string; // kept for backwards compatibility, no longer rendered
  dashboardUrl?: string;
}): string {
  const cta = opts.dashboardUrl ? ` View: ${opts.dashboardUrl}` : ' Log in to view.';
  return `New ${opts.priority} work order WO#${opts.workOrderNumber}: "${opts.title}" on ${opts.machineName}.${cta}`;
}

export function alertSmsMessage(opts: {
  alertTitle: string;
  machineName: string;
  severity: string;
  orgName?: string; // kept for backwards compatibility, no longer rendered
  dashboardUrl?: string;
}): string {
  const cta = opts.dashboardUrl ? ` View: ${opts.dashboardUrl}` : ' Check your dashboard immediately.';
  return `${opts.severity} Alert: ${opts.alertTitle} on ${opts.machineName}.${cta}`;
}

export function pmOverdueSmsMessage(opts: {
  taskTitle: string;
  machineName: string;
  daysOverdue: number;
  orgName?: string; // kept for backwards compatibility, no longer rendered
  dashboardUrl?: string;
}): string {
  const cta = opts.dashboardUrl ? ` View: ${opts.dashboardUrl}` : ' Schedule maintenance now.';
  return `PM Overdue: "${opts.taskTitle}" on ${opts.machineName} is ${opts.daysOverdue} day(s) overdue.${cta}`;
}

export function scheduleTaskAssignedSmsMessage(opts: {
  taskTitle: string;
  machineName: string;
  frequency?: string;
  nextDueAt?: string;
  assignee?: string;
  orgName?: string;
  dashboardUrl?: string;
}): string {
  const cta = opts.dashboardUrl ? ` View: ${opts.dashboardUrl}` : ' Open your dashboard to view.';
  const due = opts.nextDueAt ? ` Due ${opts.nextDueAt}.` : '';
  const assignee = opts.assignee ? ` Assigned to ${opts.assignee}.` : '';
  const freq = opts.frequency ? ` (${opts.frequency})` : '';
  return `New schedule task: "${opts.taskTitle}" on ${opts.machineName}${freq}.${assignee}${due}${cta}`;
}

export function equipmentAddedSmsMessage(opts: {
  machineName: string;
  category?: string;
  location?: string;
  criticality?: string;
  orgName?: string;
  dashboardUrl?: string;
}): string {
  const cta = opts.dashboardUrl ? ` View: ${opts.dashboardUrl}` : ' Open your dashboard to view.';
  const loc = opts.location ? ` at ${opts.location}` : '';
  const crit = opts.criticality ? ` [${opts.criticality}]` : '';
  return `New equipment added: ${opts.machineName}${loc}${crit}.${cta}`;
}
