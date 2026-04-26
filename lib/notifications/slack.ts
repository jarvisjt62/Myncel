/**
 * Slack notification dispatcher
 * Sends messages to a Slack channel using the Slack Web API or Incoming Webhooks
 */

import { db, safeQuery } from '@/lib/db';

interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
}

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: Array<{ type: string; text: string }>;
  elements?: Array<{ type: string; text?: { type: string; text: string }; url?: string }>;
}

export async function sendSlackNotification(
  organizationId: string,
  message: SlackMessage
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch the Slack integration for this organization
    const integration = await safeQuery(
      db.integration.findFirst({
        where: {
          organizationId,
          type: 'SLACK',
          status: 'CONNECTED',
        },
      }),
      null
    );

    if (!integration) {
      return { success: false, error: 'Slack integration not connected' };
    }

    const config = integration.config as Record<string, any> | null;
    const webhookUrl = integration.webhookUrl;
    const accessToken = integration.accessToken;
    const channel = config?.defaultChannel || '#general';

    // Prefer incoming webhook if available (simpler)
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Slack webhook error:', errorText);
        return { success: false, error: `Slack webhook failed: ${errorText}` };
      }

      return { success: true };
    }

    // Fall back to chat.postMessage API with bot token
    if (accessToken) {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          channel,
          ...message,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        console.error('Slack API error:', data.error);
        return { success: false, error: `Slack API error: ${data.error}` };
      }

      return { success: true };
    }

    return { success: false, error: 'No Slack webhook URL or access token available' };
  } catch (err) {
    console.error('Slack notification error:', err);
    return { success: false, error: String(err) };
  }
}

// ── Pre-built message formatters ─────────────────────────────────

export function workOrderCreatedMessage(opts: {
  workOrderNumber: string;
  title: string;
  machineName: string;
  priority: string;
  assignee?: string;
  dueDate?: string;
  appUrl: string;
}): SlackMessage {
  const priorityEmoji = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢', CRITICAL: '🚨' }[opts.priority] || '⚪';

  return {
    text: `${priorityEmoji} New work order: ${opts.title}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${priorityEmoji} New Work Order — WO#${opts.workOrderNumber}`, emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Title:*\n${opts.title}` },
          { type: 'mrkdwn', text: `*Machine:*\n${opts.machineName}` },
          { type: 'mrkdwn', text: `*Priority:*\n${opts.priority}` },
          { type: 'mrkdwn', text: `*Assigned to:*\n${opts.assignee || 'Unassigned'}` },
          ...(opts.dueDate ? [{ type: 'mrkdwn', text: `*Due:*\n${opts.dueDate}` }] : []),
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Work Order' },
            url: `${opts.appUrl}/work-orders`,
          },
        ],
      },
    ],
  };
}

export function workOrderCompletedMessage(opts: {
  workOrderNumber: string;
  title: string;
  machineName: string;
  completedBy: string;
  appUrl: string;
}): SlackMessage {
  return {
    text: `✅ Work order completed: ${opts.title}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `✅ *Work Order Completed* — WO#${opts.workOrderNumber}\n*${opts.title}* on ${opts.machineName} was completed by ${opts.completedBy}.`,
        },
      },
    ],
  };
}

export function alertTriggeredMessage(opts: {
  alertTitle: string;
  machineName: string;
  severity: string;
  message: string;
  appUrl: string;
}): SlackMessage {
  const severityEmoji = { CRITICAL: '🚨', HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' }[opts.severity] || '⚠️';

  return {
    text: `${severityEmoji} Alert: ${opts.alertTitle} on ${opts.machineName}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${severityEmoji} Equipment Alert`, emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Alert:*\n${opts.alertTitle}` },
          { type: 'mrkdwn', text: `*Machine:*\n${opts.machineName}` },
          { type: 'mrkdwn', text: `*Severity:*\n${opts.severity}` },
          { type: 'mrkdwn', text: `*Details:*\n${opts.message}` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Alerts' },
            url: `${opts.appUrl}/alerts`,
          },
        ],
      },
    ],
  };
}

export function pmOverdueMessage(opts: {
  taskTitle: string;
  machineName: string;
  daysOverdue: number;
  appUrl: string;
}): SlackMessage {
  return {
    text: `⏰ PM Overdue: ${opts.taskTitle} on ${opts.machineName} (${opts.daysOverdue}d overdue)`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `⏰ *Preventive Maintenance Overdue*\n*${opts.taskTitle}* on ${opts.machineName} is *${opts.daysOverdue} day(s) overdue*.`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Schedule' },
            url: `${opts.appUrl}/maintenance`,
          },
        ],
      },
    ],
  };
}