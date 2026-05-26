/**
 * Unified notification dispatcher
 * Sends notifications across all enabled channels (Email, Slack, SMS, Push)
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
  scheduleTaskAssignedSmsMessage,
  equipmentAddedSmsMessage,
} from './sms';
import {
  sendEmail,
  sendAlertNotificationEmail,
  sendWorkOrderAssignedEmail,
} from '@/lib/email';
import { sendPushToUsers } from './push';
import { filterPushDelivery } from './push-filter';
import { pagerDutyTrigger, pagerDutyResolve, pagerDutySeverityForAlert } from '@/lib/pagerduty';
import { sendTeamsAlert, teamsSeverityForAlert } from '@/lib/teams';

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
    }
  | {
      type: 'schedule.task_assigned';
      taskTitle: string;
      machineName: string;
      frequency?: string;
      nextDueAt?: string;
      assignee?: string;
      priority?: string;
    }
  | {
      type: 'equipment.added';
      machineName: string;
      category?: string;
      location?: string;
      criticality?: string;
    };

export async function dispatchNotifications(
  organizationId: string,
  event: NotificationEvent
): Promise<void> {
  const logPrefix = `[dispatch] org=${organizationId} event=${event.type}`;
  console.log(`${logPrefix} START`);
  try {
    // Get notification settings
    let settings = await safeQuery(
      db.notificationSetting.findFirst({
        where: { organizationId },
      }),
      null
    );

    // Load the organization name so we can include it in SMS/email messages
    const organization = await safeQuery(
      db.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      }),
      null
    );
    const orgName = organization?.name || 'Myncel';
    const dashboardUrl = `${APP_URL}/dashboard`;
    // SMS-safe URL: a) lives on canonical www host so SMS crawlers don't
    // bounce apex->www and pick up homepage OG metadata; b) /r/d returns
    // HTML with explicitly EMPTY Open Graph tags so no preview card renders.
    const SMS_URL_BASE = 'https://www.myncel.com';
    const smsDashboardUrl = `${SMS_URL_BASE}/r/d`;

    // If no settings row exists yet, check if platform SMS is available and auto-create
    if (!settings) {
      console.log(`${logPrefix} no NotificationSetting row exists — auto-creating`);
      // Check if platform Twilio exists so we can auto-enable SMS
      const adminUser = await safeQuery(
        db.user.findFirst({ where: { email: 'admin@myncel.com' }, select: { organizationId: true } }),
        null
      );
      const hasPlatformTwilio = adminUser?.organizationId ? !!(await safeQuery(
        db.integration.findFirst({
          where: { organizationId: adminUser.organizationId, type: 'TWILIO', status: 'CONNECTED' },
        }),
        null
      )) : false;

      console.log(`${logPrefix} hasPlatformTwilio=${hasPlatformTwilio}`);

      settings = await safeQuery(
        db.notificationSetting.create({
          data: {
            organizationId,
            ...(hasPlatformTwilio ? { smsEnabled: true, smsWorkOrders: true, smsAlerts: true } : {}),
          },
        }),
        null
      );
      console.log(`${logPrefix} auto-created settings smsEnabled=${settings?.smsEnabled}`);
    }

    if (!settings) {
      console.log(`${logPrefix} SKIP: no settings could be created`);
      return;
    }

    console.log(`${logPrefix} settings: smsEnabled=${settings.smsEnabled} smsWorkOrders=${settings.smsWorkOrders} smsAlerts=${settings.smsAlerts} phoneNumber=${settings.phoneNumber ? '[SET]' : '[EMPTY]'}`);

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
        (event.type === 'pm.overdue' && settings.smsAlerts) ||
        // New event types: gate them on the existing toggles closest in spirit
        (event.type === 'schedule.task_assigned' && settings.smsWorkOrders) ||
        (event.type === 'equipment.added' && settings.smsWorkOrders);

      console.log(`${logPrefix} SMS: shouldSend=${shouldSendSms} hasPhone=${!!settings.phoneNumber}`);

      if (shouldSendSms && settings.phoneNumber) {
        let smsText = '';

        if (event.type === 'work_order.created') {
          smsText = workOrderSmsMessage({ ...event, orgName, dashboardUrl: smsDashboardUrl });
        } else if (event.type === 'alert.triggered') {
          smsText = alertSmsMessage({ ...event, orgName, dashboardUrl: smsDashboardUrl });
        } else if (event.type === 'pm.overdue') {
          smsText = pmOverdueSmsMessage({ ...event, orgName, dashboardUrl: smsDashboardUrl });
        } else if (event.type === 'schedule.task_assigned') {
          smsText = scheduleTaskAssignedSmsMessage({ ...event, orgName, dashboardUrl: smsDashboardUrl });
        } else if (event.type === 'equipment.added') {
          smsText = equipmentAddedSmsMessage({ ...event, orgName, dashboardUrl: smsDashboardUrl });
        }

        if (smsText) {
          console.log(`${logPrefix} SMS: calling broadcastSms`);
          broadcastSms(organizationId, smsText, settings.smsCriticalOnly).then(result => {
            console.log(`${logPrefix} SMS result sent=${result.sent} failed=${result.failed}`);
          }).catch(err =>
            console.error(`${logPrefix} SMS dispatch error:`, err)
          );
        }
      } else {
        console.log(`${logPrefix} SMS SKIPPED: shouldSend=${shouldSendSms} phone=${settings.phoneNumber ? 'set' : 'empty'}`);
      }
    } else {
      console.log(`${logPrefix} SMS SKIPPED: smsEnabled is false`);
    }


    // ── Mobile Push notifications ────────────────────────────────────────────
    // Push goes to every user in the org who has registered a device token
    // (Capacitor / FCM / Expo). Push is "always-on" — there's no per-org toggle
    // because users opt out by simply not granting notification permission on
    // their device, or by uninstalling the mobile app. If they have a token
    // registered, they expect notifications; that's the whole point.
    //
    // We fire push for the same events that produce in-app notifications:
    //   work_order.created, work_order.completed, alert.triggered, pm.overdue,
    //   schedule.task_assigned, equipment.added.
    // The actual delivery library (sendPushToUsers) safely no-ops if no tokens
    // exist or if FCM env vars aren't configured, so this is always safe to call.
    try {
      const pushUsers = await safeQuery(
        db.user.findMany({
          where: {
            organizationId,
            mobilePushTokens: { some: {} }, // only users who have ≥1 device token
          },
          select: { id: true },
        }),
        []
      );

      if (pushUsers.length > 0) {
        let pushTitle = '';
        let pushBody = '';
        let pushLink = `${APP_URL}/dashboard`;
        const pushKind = event.type;

        if (event.type === 'work_order.created') {
          pushTitle = `New work order: ${event.workOrderNumber}`;
          pushBody = `${event.title}${event.machineName ? ` · ${event.machineName}` : ''} (${event.priority})`;
          pushLink = `${APP_URL}/dashboard?tab=work-orders`;
        } else if (event.type === 'work_order.completed') {
          pushTitle = `Work order completed: ${event.workOrderNumber}`;
          pushBody = `${event.title}${event.machineName ? ` · ${event.machineName}` : ''}`;
          pushLink = `${APP_URL}/dashboard?tab=work-orders`;
        } else if (event.type === 'alert.triggered') {
          pushTitle = `${(event as any).severity || 'Alert'}: ${(event as any).alertTitle}`;
          pushBody = `${(event as any).message}${(event as any).machineName ? ` — ${(event as any).machineName}` : ''}`;
          pushLink = `${APP_URL}/dashboard#alerts`;
        } else if (event.type === 'pm.overdue') {
          pushTitle = `Overdue: ${(event as any).taskTitle}`;
          pushBody = `${(event as any).machineName} · ${(event as any).daysOverdue} day(s) overdue`;
          pushLink = `${APP_URL}/dashboard#schedules`;
        } else if (event.type === 'schedule.task_assigned') {
          pushTitle = `Task assigned: ${(event as any).title || (event as any).taskTitle || ''}`;
          pushBody = `${(event as any).machineName || ''}${(event as any).assignee ? ` · ${(event as any).assignee}` : ''}`;
          pushLink = `${APP_URL}/dashboard#schedules`;
        } else if (event.type === 'equipment.added') {
          pushTitle = `New equipment: ${(event as any).machineName || (event as any).name || ''}`;
          pushBody = `${(event as any).category || ''}${(event as any).location ? ` · ${(event as any).location}` : ''}`;
          pushLink = `${APP_URL}/dashboard?tab=equipment`;
        }

        if (pushTitle) {
          // Honor org NotificationSetting: master push toggle, per-kind
          // toggles, and quiet hours. EMERGENCY bypasses quiet hours.
          const decision = filterPushDelivery(pushKind, settings);
          if (!decision.allow) {
            console.log(`${logPrefix} PUSH SKIPPED: ${decision.reason}`);
          } else {
            console.log(`${logPrefix} PUSH: fanning out to ${pushUsers.length} user(s)`);
            sendPushToUsers(
              pushUsers.map(u => u.id),
              { title: pushTitle, body: pushBody, link: pushLink, kind: pushKind }
            ).then(() => {
              console.log(`${logPrefix} PUSH: dispatch complete`);
            }).catch(err => {
              console.error(`${logPrefix} PUSH dispatch error:`, err);
            });
          }
        } else {
          console.log(`${logPrefix} PUSH SKIPPED: no message template for event type`);
        }
      } else {
        console.log(`${logPrefix} PUSH SKIPPED: no users with registered device tokens`);
      }
    } catch (err) {
      console.error(`${logPrefix} PUSH block error:`, err);
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

    // ── PagerDuty (only fires for alerts / overdue PMs) ────────────
    if (event.type === 'alert.triggered' || event.type === 'pm.overdue') {
      dispatchPagerDuty(organizationId, event).catch(err =>
        console.error('PagerDuty dispatch error:', err)
      );
    }

    // ── Microsoft Teams (same events as Slack) ─────────────────────
    dispatchTeams(organizationId, event).catch(err =>
      console.error('Teams dispatch error:', err)
    );

    // In-app notifications (bell icon)
    createInAppNotifications(organizationId, event).catch(err =>
      console.error('In-app notification error:', err)
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
/**
 * Create in-app (bell icon) notifications for all members of the org.
 * Mirrors the SMS/email events into Notification rows so users can see
 * recent activity in the app even if they have SMS/email disabled.
 */
async function createInAppNotifications(
  organizationId: string,
  event: NotificationEvent
): Promise<void> {
  try {
    const users = await safeQuery(
      db.user.findMany({
        where: { organizationId },
        select: { id: true },
      }),
      [] as { id: string }[]
    );
    if (!users || users.length === 0) return;

    let title = '';
    let message = '';
    let type: any = 'SYSTEM_ANNOUNCEMENT';
    let priority: any = 'NORMAL';
    let link = '/dashboard';
    let relatedType: string | null = null;

    if (event.type === 'work_order.created') {
      type = 'WORK_ORDER_ASSIGNED';
      priority = event.priority === 'HIGH' || event.priority === 'CRITICAL' ? 'HIGH' : 'NORMAL';
      title = `New work order: ${event.workOrderNumber}`;
      message = `${event.priority} priority — "${event.title}" on ${event.machineName}`;
      link = '/dashboard#work-orders';
      relatedType = 'work_order';
    } else if (event.type === 'work_order.completed') {
      type = 'WORK_ORDER_COMPLETED';
      title = `Work order completed: ${event.workOrderNumber}`;
      message = `${event.title} — completed by ${event.completedBy}`;
      link = '/dashboard#work-orders';
      relatedType = 'work_order';
    } else if (event.type === 'alert.triggered') {
      type = 'MACHINE_ALERT';
      priority = event.severity === 'CRITICAL' ? 'URGENT' : 'HIGH';
      title = `${event.severity} alert: ${event.alertTitle}`;
      message = `${event.machineName} — ${event.message}`;
      link = '/dashboard#alerts';
      relatedType = 'alert';
    } else if (event.type === 'pm.overdue') {
      type = 'MAINTENANCE_OVERDUE';
      priority = 'HIGH';
      title = `PM overdue: ${event.taskTitle}`;
      message = `${event.machineName} — ${event.daysOverdue} day(s) overdue`;
      link = '/dashboard#schedules';
      relatedType = 'maintenance_task';
    } else if (event.type === 'schedule.task_assigned') {
      type = 'MAINTENANCE_DUE';
      priority = event.priority === 'HIGH' || event.priority === 'CRITICAL' ? 'HIGH' : 'NORMAL';
      title = `New schedule task: ${event.taskTitle}`;
      const parts: string[] = [event.machineName];
      if (event.frequency) parts.push(event.frequency);
      if (event.assignee) parts.push(`assigned to ${event.assignee}`);
      if (event.nextDueAt) parts.push(`due ${event.nextDueAt}`);
      message = parts.join(' · ');
      link = '/dashboard#schedules';
      relatedType = 'maintenance_task';
    } else if (event.type === 'equipment.added') {
      type = 'SYSTEM_ANNOUNCEMENT';
      priority = event.criticality === 'HIGH' || event.criticality === 'CRITICAL' ? 'HIGH' : 'NORMAL';
      title = `New equipment added: ${event.machineName}`;
      const parts: string[] = [];
      if (event.category) parts.push(event.category);
      if (event.location) parts.push(event.location);
      if (event.criticality) parts.push(`criticality: ${event.criticality}`);
      message = parts.length > 0 ? parts.join(' · ') : `${event.machineName} is now in the registry.`;
      link = '/dashboard#machines';
      relatedType = 'machine';
    } else {
      return;
    }

    await safeQuery(
      db.notification.createMany({
        data: users.map(u => ({
          userId: u.id,
          type,
          title,
          message,
          priority,
          link,
          relatedType,
        })),
      }),
      null
    );
  } catch (err) {
    console.error('createInAppNotifications error:', err);
  }
}

/* ────────────────────────────────────────────────────────────────────
   PagerDuty fan-out
   Fired for alerts and overdue PMs. dedup_key keys are stable per
   logical incident so re-firing the same event updates the existing
   incident in PagerDuty rather than creating a new one.
   ──────────────────────────────────────────────────────────────────── */
async function dispatchPagerDuty(
  organizationId: string,
  event: NotificationEvent
): Promise<void> {
  try {
    const integration = await safeQuery(
      db.integration.findFirst({
        where: { organizationId, type: 'PAGERDUTY' as any, status: 'CONNECTED' },
      }),
      null
    );
    if (!integration?.apiKey) return;
    const routingKey = integration.apiKey;

    if (event.type === 'alert.triggered') {
      const e = event as any;
      await pagerDutyTrigger({
        routingKey,
        dedupKey: `myncel-alert-${e.alertId || `${organizationId}-${e.machineName}-${e.alertType}`}`,
        summary: `${e.alertType || 'Alert'} on ${e.machineName}`,
        source: e.machineName || 'Myncel',
        severity: pagerDutySeverityForAlert(e.severity),
        component: e.sensorName,
        group: e.location,
        class: e.alertType,
        customDetails: {
          message: e.message,
          severity: e.severity,
          machineId: e.machineId,
          alertId: e.alertId,
        },
        clickThroughUrl: `${APP_URL}/dashboard#alerts`,
      });
    } else if (event.type === 'pm.overdue') {
      const e = event as any;
      await pagerDutyTrigger({
        routingKey,
        dedupKey: `myncel-pm-${e.taskId || `${organizationId}-${e.machineName}-${e.taskTitle}`}`,
        summary: `PM overdue: ${e.taskTitle} on ${e.machineName}`,
        source: e.machineName || 'Myncel',
        severity: e.daysOverdue && e.daysOverdue > 7 ? 'error' : 'warning',
        class: 'pm_overdue',
        customDetails: {
          taskTitle: e.taskTitle,
          daysOverdue: e.daysOverdue,
          machineName: e.machineName,
        },
        clickThroughUrl: `${APP_URL}/dashboard#schedules`,
      });
    }
  } catch (err) {
    console.error('PagerDuty dispatch error:', err);
  }
}

/* ────────────────────────────────────────────────────────────────────
   Microsoft Teams fan-out — adaptive cards.
   Fires for the same events that Slack does.
   ──────────────────────────────────────────────────────────────────── */
async function dispatchTeams(
  organizationId: string,
  event: NotificationEvent
): Promise<void> {
  try {
    const integration = await safeQuery(
      db.integration.findFirst({
        where: { organizationId, type: 'MS_TEAMS' as any, status: 'CONNECTED' },
      }),
      null
    );
    if (!integration?.webhookUrl) return;
    const webhookUrl = integration.webhookUrl;

    if (event.type === 'work_order.created') {
      const e = event as any;
      await sendTeamsAlert({
        webhookUrl,
        title: `New work order: ${e.title}`,
        badge: `WO #${e.workOrderNumber} • ${e.priority || 'NORMAL'}`,
        severity: e.priority === 'CRITICAL' || e.priority === 'HIGH' ? 'warning' : 'info',
        message: `Created on ${e.machineName}.${e.assignee ? ` Assigned to ${e.assignee}.` : ''}${e.dueDate ? ` Due ${e.dueDate}.` : ''}`,
        facts: [
          { name: 'Machine', value: e.machineName },
          ...(e.assignee ? [{ name: 'Assignee', value: e.assignee }] : []),
          ...(e.dueDate ? [{ name: 'Due', value: e.dueDate }] : []),
          { name: 'Priority', value: e.priority || 'NORMAL' },
        ],
        actions: [{ title: 'Open work order', url: `${APP_URL}/dashboard#work-orders` }],
      });
    } else if (event.type === 'work_order.completed') {
      const e = event as any;
      await sendTeamsAlert({
        webhookUrl,
        title: `Work order completed: ${e.title}`,
        badge: `WO #${e.workOrderNumber}`,
        severity: 'success',
        message: `${e.completedBy} completed work on ${e.machineName}.`,
        facts: [
          { name: 'Machine', value: e.machineName },
          { name: 'Completed by', value: e.completedBy },
        ],
        actions: [{ title: 'View details', url: `${APP_URL}/dashboard#work-orders` }],
      });
    } else if (event.type === 'alert.triggered') {
      const e = event as any;
      await sendTeamsAlert({
        webhookUrl,
        title: `${e.alertType || 'Alert'} on ${e.machineName}`,
        badge: e.severity || 'ALERT',
        severity: teamsSeverityForAlert(e.severity),
        message: e.message || 'A sensor threshold was exceeded or a fault code was reported.',
        facts: [
          { name: 'Machine', value: e.machineName },
          ...(e.sensorName ? [{ name: 'Sensor', value: e.sensorName }] : []),
          { name: 'Severity', value: e.severity || 'unspecified' },
        ],
        actions: [{ title: 'Open alert', url: `${APP_URL}/dashboard#alerts` }],
      });
    } else if (event.type === 'pm.overdue') {
      const e = event as any;
      await sendTeamsAlert({
        webhookUrl,
        title: `PM overdue: ${e.taskTitle}`,
        badge: `${e.daysOverdue || '?'} day${e.daysOverdue === 1 ? '' : 's'} overdue`,
        severity: e.daysOverdue && e.daysOverdue > 7 ? 'error' : 'warning',
        message: `Scheduled preventive maintenance on ${e.machineName} is past due.`,
        facts: [
          { name: 'Machine', value: e.machineName },
          { name: 'Task', value: e.taskTitle },
          { name: 'Days overdue', value: String(e.daysOverdue || '?') },
        ],
        actions: [{ title: 'View schedule', url: `${APP_URL}/dashboard#schedules` }],
      });
    }
  } catch (err) {
    console.error('Teams dispatch error:', err);
  }
}
