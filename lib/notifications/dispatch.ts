/**
 * Unified notification dispatcher
 * Sends notifications across all enabled channels (Email, Slack, SMS)
 * based on the organization's notification settings.
 */

import { db, safeQuery } from '@/lib/db';
import {
  sendSlackNotification,
  workOrderCreatedMessage,
  workOrderCompletedMessage,
  alertTriggeredMessage,
  pmOverdueMessage,
} from './slack';
import {
  broadcastSms,
  workOrderSmsMessage,
  alertSmsMessage,
  pmOverdueSmsMessage,
} from './sms';

const APP_URL = process.env.NEXTAUTH_URL || 'https://myncel.com';

export type NotificationEvent =
  | {
      type: 'work_order.created';
      workOrderNumber: string;
      title: string;
      machineName: string;
      priority: string;
      assignee?: string;
      dueDate?: string;
    }
  | {
      type: 'work_order.completed';
      workOrderNumber: string;
      title: string;
      machineName: string;
      completedBy: string;
    }
  | {
      type: 'alert.triggered';
      alertTitle: string;
      machineName: string;
      severity: string;
      message: string;
    }
  | {
      type: 'pm.overdue';
      taskTitle: string;
      machineName: string;
      daysOverdue: number;
    };

export async function dispatchNotifications(
  organizationId: string,
  event: NotificationEvent
): Promise<void> {
  try {
    // Get notification settings
    const settings = await safeQuery(
      db.notificationSetting.findFirst({
        where: { organizationId },
      }),
      null
    );

    if (!settings) return;

    const isCritical = event.type === 'alert.triggered' &&
      ['CRITICAL', 'HIGH'].includes((event as any).severity || '');

    // ── Slack notifications ─────────────────────────────────────
    if (settings.slackEnabled) {
      const shouldSendSlack =
        (event.type === 'work_order.created' && settings.slackWorkOrders) ||
        (event.type === 'work_order.completed' && settings.slackWorkOrders) ||
        (event.type === 'alert.triggered' && settings.slackAlerts) ||
        (event.type === 'pm.overdue' && settings.slackAlerts);

      if (shouldSendSlack) {
        let slackMsg;

        if (event.type === 'work_order.created') {
          slackMsg = workOrderCreatedMessage({ ...event, appUrl: APP_URL });
        } else if (event.type === 'work_order.completed') {
          slackMsg = workOrderCompletedMessage({ ...event, appUrl: APP_URL });
        } else if (event.type === 'alert.triggered') {
          slackMsg = alertTriggeredMessage({ ...event, appUrl: APP_URL });
        } else if (event.type === 'pm.overdue') {
          slackMsg = pmOverdueMessage({ ...event, appUrl: APP_URL });
        }

        if (slackMsg) {
          sendSlackNotification(organizationId, slackMsg).catch(err =>
            console.error('Slack dispatch error:', err)
          );
        }
      }
    }

    // ── SMS notifications ───────────────────────────────────────
    if (settings.smsEnabled) {
      const shouldSendSms =
        (event.type === 'work_order.created' && settings.smsWorkOrders) ||
        (event.type === 'alert.triggered' && settings.smsAlerts &&
          (!settings.smsCriticalOnly || isCritical)) ||
        (event.type === 'pm.overdue' && settings.smsAlerts);

      if (shouldSendSms && settings.phoneNumber) {
        let smsText = '';

        if (event.type === 'work_order.created') {
          smsText = workOrderSmsMessage(event);
        } else if (event.type === 'alert.triggered') {
          smsText = alertSmsMessage(event);
        } else if (event.type === 'pm.overdue') {
          smsText = pmOverdueSmsMessage(event);
        }

        if (smsText) {
          broadcastSms(organizationId, smsText, settings.smsCriticalOnly).catch(err =>
            console.error('SMS dispatch error:', err)
          );
        }
      }
    }

    // ── Webhook notifications ───────────────────────────────────
    dispatchWebhooks(organizationId, event).catch(err =>
      console.error('Webhook dispatch error:', err)
    );
  } catch (err) {
    console.error('Notification dispatch error:', err);
  }
}

/**
 * Dispatch event to all registered webhooks for this organization
 */
async function dispatchWebhooks(
  organizationId: string,
  event: NotificationEvent
): Promise<void> {
  try {
    const allWebhooks = await safeQuery(
      db.webhook.findMany({
        where: {
          organizationId,
          isActive: true,
        },
      }),
      []
    );

    // Filter by event type in memory (events is a Json array field, not queryable with Prisma has)
    const webhooks = allWebhooks.filter(wh => {
      const events = wh.events as string[];
      return Array.isArray(events) && (events.includes(event.type) || events.includes('*'));
    });

    if (!webhooks.length) return;

    const payload = {
      event: event.type,
      timestamp: new Date().toISOString(),
      data: event,
    };

    await Promise.allSettled(
      webhooks.map(async webhook => {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Myncel-Event': event.type,
            'X-Myncel-Delivery': crypto.randomUUID(),
          };

          if (webhook.secret) {
            // Add HMAC signature for webhook verification
            const sig = await computeHmac(webhook.secret, JSON.stringify(payload));
            headers['X-Myncel-Signature'] = `sha256=${sig}`;
          }

          const res = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000), // 10s timeout
          });

          if (!res.ok) {
            console.warn(`Webhook ${webhook.id} returned ${res.status}`);
          }
        } catch (err) {
          console.error(`Webhook ${webhook.id} failed:`, err);
        }
      })
    );
  } catch (err) {
    console.error('Webhook dispatch error:', err);
  }
}

async function computeHmac(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}