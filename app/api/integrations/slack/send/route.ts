import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

/**
 * POST /api/integrations/slack/send
 *
 * Sends a maintenance digest / notification to the connected Slack workspace.
 * Demonstrates active use of the `chat:write` scope.
 *
 * Request body (optional):
 *   {
 *     mode?: 'digest' | 'test' | 'custom',
 *     channel?: string,       // override default channel, e.g. "#maintenance"
 *     text?: string,          // used only when mode === 'custom'
 *   }
 *
 * Response:
 *   { success: true, ts, channel, mode }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, organizationId: true, name: true },
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const mode: 'digest' | 'test' | 'custom' = body.mode || 'digest';

    const integration = await safeQuery(
      db.integration.findFirst({
        where: {
          organizationId: user.organizationId,
          type: 'SLACK',
          status: 'CONNECTED',
        },
      }),
      null
    );

    if (!integration) {
      return NextResponse.json(
        { error: 'Slack is not connected. Please connect it in Settings → Integrations.' },
        { status: 400 }
      );
    }

    const accessToken = integration.accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Slack integration is missing a bot token. Please reconnect.' },
        { status: 400 }
      );
    }

    const cfg = (integration.config as any) || {};
    const channel: string = body.channel || cfg.defaultChannel || '#general';

    // Build the message
    let text: string;
    let blocks: any[] | undefined;

    if (mode === 'test') {
      text = `✅ Myncel is connected to Slack! This is a test message from ${user.name || 'the Myncel team'}.`;
    } else if (mode === 'custom') {
      text = String(body.text || '').slice(0, 3900);
      if (!text) {
        return NextResponse.json({ error: 'text is required when mode=custom' }, { status: 400 });
      }
    } else {
      // digest - pull real data from the org
      const [openWorkOrders, criticalAlerts, dueMaintenance] = await Promise.all([
        safeQuery(
          db.workOrder.count({
            where: {
              organizationId: user.organizationId,
              status: { in: ['OPEN', 'IN_PROGRESS'] },
            },
          }),
          0
        ),
        safeQuery(
          db.alert.count({
            where: {
              organizationId: user.organizationId,
              severity: 'CRITICAL',
              isResolved: false,
            },
          }),
          0
        ),
        safeQuery(
          db.workOrder.count({
            where: {
              organizationId: user.organizationId,
              dueAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
              status: { not: 'COMPLETED' },
            },
          }),
          0
        ),
      ]);

      // Grab top 5 open work orders for display
      const topOpen = await safeQuery(
        db.workOrder.findMany({
          where: {
            organizationId: user.organizationId,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
          },
          orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
          take: 5,
          select: {
            id: true,
            woNumber: true,
            title: true,
            priority: true,
            dueAt: true,
            status: true,
          },
        }),
        []
      );

      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      text = `📋 Myncel Maintenance Digest — ${today}: ${openWorkOrders} open work orders, ${criticalAlerts} critical alerts, ${dueMaintenance} due this week.`;

      blocks = [
        {
          type: 'header',
          text: { type: 'plain_text', text: `📋 Myncel Maintenance Digest` },
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `*${today}*` }],
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Open Work Orders*\n${openWorkOrders}` },
            { type: 'mrkdwn', text: `*Critical Alerts*\n${criticalAlerts}` },
            { type: 'mrkdwn', text: `*Due This Week*\n${dueMaintenance}` },
          ],
        },
      ];

      if (topOpen && topOpen.length > 0) {
        blocks.push({ type: 'divider' });
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              `*🔧 Top Open Work Orders*\n` +
              topOpen
                .map(w => {
                  const due = w.dueAt
                    ? ` · due ${new Date(w.dueAt).toLocaleDateString()}`
                    : '';
                  const pri = w.priority ? ` \`${w.priority}\`` : '';
                  return `• *${w.woNumber || w.id.slice(0, 8)}* — ${w.title}${pri}${due}`;
                })
                .join('\n'),
          },
        });
      }

      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Sent by Myncel · <${process.env.NEXTAUTH_URL || 'https://www.myncel.com'}/work-orders|View in Myncel>`,
          },
        ],
      });
    }

    // === Slack API: send message ===
    // Uses scope: chat:write
    const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel,
        text,
        blocks,
        unfurl_links: false,
      }),
    });

    const slackData = await slackRes.json();
    if (!slackData.ok) {
      console.error('Slack send failed:', slackData);
      return NextResponse.json(
        { error: `Slack error: ${slackData.error || 'unknown'}`, detail: slackData },
        { status: 502 }
      );
    }

    // Audit log
    await safeQuery(
      (db as any).activityLog?.create?.({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          type: 'INTEGRATION_SEND',
          description: `Sent Slack ${mode} to ${slackData.channel || channel}`,
          metadata: { integration: 'slack', mode, ts: slackData.ts },
        },
      }) || Promise.resolve(null),
      null
    );

    return NextResponse.json({
      success: true,
      mode,
      ts: slackData.ts,
      channel: slackData.channel || channel,
      team: (integration.config as any)?.teamName || null,
    });
  } catch (err: any) {
    console.error('Slack send error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to send Slack message' },
      { status: 500 }
    );
  }
}
