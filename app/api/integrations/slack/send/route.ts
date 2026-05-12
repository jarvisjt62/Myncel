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

    // Fallback: if the user's org doesn't have its own Slack integration,
    // check if the platform admin org has one connected (platform-inherited model).
    let effectiveIntegration = integration;
    if (!effectiveIntegration) {
      const adminUser = await safeQuery(
        db.user.findFirst({
          where: { email: 'admin@myncel.com' },
          select: { organizationId: true },
        }),
        null
      );
      if (adminUser?.organizationId && adminUser.organizationId !== user.organizationId) {
        effectiveIntegration = await safeQuery(
          db.integration.findFirst({
            where: {
              organizationId: adminUser.organizationId,
              type: 'SLACK',
              status: 'CONNECTED',
            },
          }),
          null
        );
      }
    }

    if (!effectiveIntegration) {
      return NextResponse.json(
        { error: 'Slack is not connected. Please connect it in Settings → Integrations.' },
        { status: 400 }
      );
    }

    const accessToken = effectiveIntegration.accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Slack integration is missing a bot token. Please reconnect.' },
        { status: 400 }
      );
    }

    const cfg = (effectiveIntegration.config as any) || {};
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
    // Helper that posts to a channel
    const postTo = async (targetChannel: string) => {
      const r = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          channel: targetChannel,
          text,
          blocks,
          unfurl_links: false,
        }),
      });
      const data = await r.json();
      return { ok: data.ok, data, usedChannel: targetChannel };
    };

    let result = await postTo(channel);

    // If the configured channel doesn't exist (common when the bot didn't get
    // an incoming webhook, or when #general was renamed/deleted), try to
    // auto-discover a channel the bot is already a member of and retry.
    if (!result.ok && result.data?.error === 'channel_not_found') {
      try {
        // scope: channels:read (we requested it during OAuth)
        const listRes = await fetch(
          'https://slack.com/api/conversations.list?exclude_archived=true&types=public_channel&limit=200',
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const listData = await listRes.json();
        const candidates: any[] = Array.isArray(listData.channels) ? listData.channels : [];
        // Prefer channels the bot is already in; fall back to general/random/any
        const memberOf = candidates.filter(c => c.is_member);
        const preferred =
          memberOf.find(c => c.is_general) ||
          memberOf.find(c => ['maintenance', 'ops', 'operations', 'random'].includes(c.name)) ||
          memberOf[0] ||
          candidates.find(c => c.is_general) ||
          candidates.find(c => c.name === 'random') ||
          candidates[0];

        if (preferred?.id) {
          // If the bot isn't a member yet, try to join (needs channels:join; harmless if it fails)
          if (!preferred.is_member) {
            await fetch('https://slack.com/api/conversations.join', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({ channel: preferred.id }),
            }).catch(() => {});
          }
          result = await postTo(preferred.id);
        }
      } catch (discoverErr) {
        console.error('[slack send] channel discovery failed:', discoverErr);
      }
    }

    // If we still can't post (e.g. bot isn't in any channel yet), return a
    // clear, actionable error explaining what the user needs to do.
    if (!result.ok) {
      console.error('Slack send failed:', result.data);
      const err = result.data?.error || 'unknown';
      let friendly = `Slack error: ${err}`;
      if (err === 'channel_not_found') {
        friendly =
          "Slack channel not found. In Slack, invite the Myncel bot to a channel with '/invite @Myncel' and try again. Or open Settings → Integrations and reconnect Slack to pick a default channel.";
      } else if (err === 'not_in_channel') {
        friendly =
          "The Myncel bot is not in the target channel. In Slack, run '/invite @Myncel' in that channel and try again.";
      } else if (err === 'invalid_auth' || err === 'token_revoked' || err === 'account_inactive') {
        friendly = 'Slack token is invalid or revoked. Please reconnect Slack in Settings → Integrations.';
      }
      return NextResponse.json({ error: friendly, detail: result.data }, { status: 502 });
    }

    const slackData = result.data;

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
      team: (effectiveIntegration.config as any)?.teamName || null,
    });
  } catch (err: any) {
    console.error('Slack send error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to send Slack message' },
      { status: 500 }
    );
  }
}
