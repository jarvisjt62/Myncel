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
import {
  sendEmail,
  sendAlertNotificationEmail,
  sendWorkOrderAssignedEmail,
} from '@/lib/email';

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


    // ── Email notifications ────────────────────────────────────────────────────────────────
    // Email notifications are enabled if any of the individual settings are true
    const shouldSendEmail =
      (event.type === 'work_order.created' && settings.emailWorkOrders) ||
      (event.type === 'work_order.completed' && settings.emailWorkOrders) ||
      (event.type === 'alert.triggered' && settings.emailAlerts) ||
      (event.type === 'pm.overdue' && settings.emailReports);

    if (shouldSendEmail) {
      // Get organization users to send emails to
      const users = await safeQuery(
        db.user.findMany({
          where: {
            organizationId,
            emailVerified: { not: null },
          },
          select: {
            email: true,
            name: true,
          },
        }),
        []
      );

      if (users.length > 0) {
        if (event.type === 'work_order.created') {
          // Send work order assigned email to all relevant users
          const dueDate = (event as any).dueDate;
          
          await Promise.allSettled(
            users.map(user =>
              sendWorkOrderAssignedEmail(
                user.email!,
                user.name || 'Team Member',
                event.title,
                event.workOrderNumber,
                event.machineName,
                event.priority,
                dueDate ? new Date(dueDate) : null,
                'System'
              )
            )
          );
        } else if (event.type === 'alert.triggered') {
          // Send alert notification email
          await Promise.allSettled(
            users.map(user =>
              sendAlertNotificationEmail(
                user.email!,
                user.name || 'Team Member',
                event.alertTitle,
                event.message,
                event.severity,
                event.machineName
              )
            )
          );
        } else if (event.type === 'pm.overdue') {
          // Send PM overdue notification
          await Promise.allSettled(
            users.map(user =>
              sendEmail({
                to: user.email!,
                subject: `[OVERDUE] Maintenance Task: ${event.taskTitle}`,
                html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,sans-serif;line-height:1.6;color:#0a2540;background:#f6f9fc;margin:0;padding:20px}.container{max-width:580px;margin:0 auto}.card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}.header{background:#f59e0b;padding:32px 36px}.header h1{color:#fff;margin:0;font-size:22px}.header p{color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px}.body{padding:32px 36px}.alert-box{background:#fff8f0;border:1px solid #f59e0b33;border-left:4px solid #f59e0b;border-radius:0 10px 10px 0;padding:16px 20px;margin:16px 0}.cta{display:block;background:#635bff;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;text-align:center;margin:24px 0}.footer{text-align:center;padding:16px;font-size:13px;color:#8898aa;border-top:1px solid #e6ebf1}</style></head><body><div class="container"><div class="card"><div class="header"><h1>⚠️ Overdue Maintenance</h1><p>${event.machineName}</p></div><div class="body"><p>Hi ${user.name || 'Team Member'},</p><p>A maintenance task is <strong>${event.daysOverdue} day(s) overdue</strong>:</p><div class="alert-box"><strong>${event.taskTitle}</strong><p style="margin:8px 0 0;color:#425466">Machine: ${event.machineName}</p></div><a href="${APP_URL}/dashboard#schedules" class="cta">View Schedule in Dashboard →</a></div><div class="footer"><p>Myncel — AI-Powered Maintenance Management</p></div></div></div></body></html>`,
              })
            )
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

    // Also include platform-wide (admin) webhooks
    const adminUser = await safeQuery(
      db.user.findFirst({
        where: { email: 'admin@myncel.com' },
        select: { organizationId: true },
      }),
      null
    );
    let adminWebhooks: any[] = [];
    if (adminUser?.organizationId && adminUser.organizationId !== organizationId) {
      adminWebhooks = await safeQuery(
        db.webhook.findMany({
          where: {
            organizationId: adminUser.organizationId,
            isActive: true,
          },
        }),
        []
      );
    }
    const combinedWebhooks = [...allWebhooks, ...adminWebhooks];

    // Filter by event type in memory (events is a Json array field, not queryable with Prisma has)
    const webhooks = combinedWebhooks.filter(wh => {
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