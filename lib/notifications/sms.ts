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
  try {
    // Fetch Twilio integration config
    const integration = await safeQuery(
      db.integration.findFirst({
        where: {
          organizationId,
          type: 'TWILIO',
          status: 'CONNECTED',
        },
      }),
      null
    );

    if (!integration) {
      return { success: false, error: 'SMS integration not connected' };
    }

    const config = integration.config as Record<string, any> | null;
    if (!config?.accountSid || !config?.authToken || !config?.fromNumber) {
      return { success: false, error: 'Twilio configuration incomplete' };
    }

    const { accountSid, authToken, fromNumber } = config;

    // Truncate to SMS max length
    const truncatedMessage = message.length > 160 ? message.slice(0, 157) + '…' : message;

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
      return { success: true, sid: data.sid };
    } else {
      console.error('Twilio SMS error:', data);
      return { success: false, error: data.message || 'Twilio send failed' };
    }
  } catch (err) {
    console.error('SMS notification error:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Send SMS to all users in an organization who have SMS enabled
 */
export async function broadcastSms(
  organizationId: string,
  message: string,
  criticalOnly = false
): Promise<{ sent: number; failed: number }> {
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

    if (!settings?.smsEnabled) return { sent: 0, failed: 0 };
    if (criticalOnly && !settings.smsCriticalOnly) return { sent: 0, failed: 0 };

    const phoneNumber = settings.phoneNumber;
    if (!phoneNumber) return { sent: 0, failed: 0 };

    const result = await sendSmsNotification(organizationId, phoneNumber, message);
    if (result.success) sent++;
    else failed++;
  } catch (err) {
    console.error('Broadcast SMS error:', err);
    failed++;
  }

  return { sent, failed };
}

// ── Pre-built SMS message formatters ─────────────────────────────

export function workOrderSmsMessage(opts: {
  workOrderNumber: string;
  title: string;
  machineName: string;
  priority: string;
}): string {
  return `[Myncel] New ${opts.priority} work order WO#${opts.workOrderNumber}: "${opts.title}" on ${opts.machineName}. Log in to view.`;
}

export function alertSmsMessage(opts: {
  alertTitle: string;
  machineName: string;
  severity: string;
}): string {
  return `[Myncel] ${opts.severity} Alert: ${opts.alertTitle} on ${opts.machineName}. Check your dashboard immediately.`;
}

export function pmOverdueSmsMessage(opts: {
  taskTitle: string;
  machineName: string;
  daysOverdue: number;
}): string {
  return `[Myncel] PM Overdue: "${opts.taskTitle}" on ${opts.machineName} is ${opts.daysOverdue} day(s) overdue. Schedule maintenance now.`;
}