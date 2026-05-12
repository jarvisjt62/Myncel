import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { slackPostWithFallback } from '@/lib/slack';

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
    const idsList: string[] | undefined = Array.isArray(body.ids) && body.ids.length > 0 ? body.ids : undefined;

    // Platform-admin-only override: admin can build a digest scoped to any org's data
    const isPlatformAdmin = session.user.email === 'admin@myncel.com';
    const requestedOrgId: string | undefined = body.targetOrgId;
    const dataOrgId = isPlatformAdmin && requestedOrgId ? requestedOrgId : user.organizationId;

    // Resolve org name for digest header (shown in the Slack message when admin targets another org)
    const targetOrgInfo = isPlatformAdmin && requestedOrgId
      ? await safeQuery(db.organization.findUnique({ where: { id: requestedOrgId }, select: { name: true } }), null)
      : null;

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
              organizationId: dataOrgId,
              status: { in: ['OPEN', 'IN_PROGRESS'] },
              ...(idsList ? { id: { in: idsList } } : {}),
            },
          }),
          0
        ),
        safeQuery(
          db.alert.count({
            where: {
              organizationId: dataOrgId,
              severity: 'CRITICAL',
              isResolved: false,
              ...(idsList ? { id: { in: idsList } } : {}),
            },
          }),
          0
        ),
        safeQuery(
          db.workOrder.count({
            where: {
              organizationId: dataOrgId,
              dueAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
              status: { not: 'COMPLETED' },
              ...(idsList ? { id: { in: idsList } } : {}),
            },
          }),
          0
        ),
      ]);

      // Grab top 5 open work orders for display
      const topOpen = await safeQuery(
        db.workOrder.findMany({
          where: {
            organizationId: dataOrgId,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
            ...(idsList ? { id: { in: idsList } } : {}),
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

      const orgLabel = targetOrgInfo?.name ? ` — ${targetOrgInfo.name}` : '';
      const scopeLabel = idsList ? ` (${idsList.length} selected items)` : '';

      text = `📋 Myncel Maintenance Digest${orgLabel} — ${today}: ${openWorkOrders} open work orders, ${criticalAlerts} critical alerts, ${dueMaintenance} due this week.${scopeLabel}`;

      blocks = [
        {
          type: 'header',
          text: { type: 'plain_text', text: `📋 Myncel Maintenance Digest${orgLabel}` },
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `*${today}*${scopeLabel ? ` · ${scopeLabel.trim()}` : ''}` },
          ],
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

    // === Slack API: send message with robust fallback ===
    // Uses helper from lib/slack.ts which:
    //  1. Tries preferred channel
    //  2. On channel_not_found / not_in_channel: picks a channel the bot is member of
    //  3. Tries to conversations.join public channels if needed
    //  4. Final fallback: DMs the installing user
    const result = await slackPostWithFallback(accessToken, channel, text, blocks);

    if (!result.ok) {
      console.error('Slack send failed:', result.error, result.raw);
      return NextResponse.json(
        { error: result.friendlyError || `Slack error: ${result.error}`, detail: result.raw },
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
          description: `Sent Slack ${mode} to ${result.channelName || result.channel} (${result.fallbackUsed})`,
          metadata: { integration: 'slack', mode, ts: result.ts, fallbackUsed: result.fallbackUsed },
        },
      }) || Promise.resolve(null),
      null
    );

    // Build a user-facing message that tells them exactly where it landed.
    const landedAt =
      result.fallbackUsed === 'dm'
        ? 'your Slack DM with the Myncel bot'
        : result.channelName
        ? `#${result.channelName}`
        : result.channel || channel;

    return NextResponse.json({
      success: true,
      mode,
      ts: result.ts,
      channel: result.channel || channel,
      channelName: result.channelName,
      fallbackUsed: result.fallbackUsed,
      landedAt,
      team: (effectiveIntegration.config as any)?.teamName || null,
      message: `Posted to ${landedAt}`,
    });
  } catch (err: any) {
    console.error('Slack send error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to send Slack message' },
      { status: 500 }
    );
  }
}
