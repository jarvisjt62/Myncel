import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db';
import { slackPostWithFallback } from '@/lib/slack';

/**
 * GET /api/cron/slack-digest
 *
 * Scheduled daily Slack digest. Vercel cron calls this once a day.
 * Iterates over every organization with a connected Slack integration and
 * sends a Block Kit maintenance digest to their default channel.
 *
 * Security: Vercel cron requests include an Authorization header set to
 *   `Bearer ${CRON_SECRET}`. Requests without a matching secret are rejected.
 *
 * Configured via vercel.json:
 *   { "path": "/api/cron/slack-digest", "schedule": "0 13 * * *" }   // 13:00 UTC = 08:00 ET
 */

// Ensure Node.js runtime (need Prisma)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // === Auth check ===
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization') || '';
  const userAgent = req.headers.get('user-agent') || '';

  // Vercel Cron sends "Bearer <CRON_SECRET>" when CRON_SECRET is set.
  // Also allow manual invocation with ?token=<secret> for testing.
  const { searchParams } = new URL(req.url);
  const tokenParam = searchParams.get('token') || '';

  const isVercelCron = userAgent.includes('vercel-cron');
  const hasValidBearer = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const hasValidToken = cronSecret && tokenParam === cronSecret;

  if (!isVercelCron && !hasValidBearer && !hasValidToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const results: {
    organizationId: string;
    organizationName: string;
    channel?: string;
    success: boolean;
    error?: string;
    ts?: string;
  }[] = [];

  try {
    // Find every connected Slack integration with a bot token.
    const integrations = await safeQuery(
      db.integration.findMany({
        where: {
          type: 'SLACK',
          status: 'CONNECTED',
          accessToken: { not: null },
        },
        include: {
          organization: { select: { id: true, name: true } },
        },
      }),
      [] as any[]
    );

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No organizations with Slack connected.',
        processed: 0,
        durationMs: Date.now() - startedAt,
      });
    }

    for (const integration of integrations) {
      const orgId = integration.organizationId;
      const orgName = integration.organization?.name || 'Unknown';
      const cfg = (integration.config as any) || {};
      const channel: string = cfg.defaultChannel || '#general';

      // Respect per-org schedule preferences (if set in config.digest)
      const digestPrefs = cfg.digest || {};
      if (digestPrefs.enabled === false) {
        results.push({
          organizationId: orgId,
          organizationName: orgName,
          success: true,
          error: 'skipped (digest disabled for org)',
        });
        continue;
      }

      try {
        // Gather stats for this org
        const [openCount, criticalAlerts, dueThisWeek, topOpen] = await Promise.all([
          safeQuery(
            db.workOrder.count({
              where: { organizationId: orgId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
            }),
            0
          ),
          safeQuery(
            db.alert.count({
              where: { organizationId: orgId, severity: 'CRITICAL', isResolved: false },
            }),
            0
          ),
          safeQuery(
            db.workOrder.count({
              where: {
                organizationId: orgId,
                dueAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
                status: { not: 'COMPLETED' },
              },
            }),
            0
          ),
          safeQuery(
            db.workOrder.findMany({
              where: { organizationId: orgId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
              orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
              take: 5,
              select: { id: true, woNumber: true, title: true, priority: true, dueAt: true },
            }),
            [] as any[]
          ),
        ]);

        // Skip orgs that have literally nothing to report
        if (openCount === 0 && criticalAlerts === 0 && dueThisWeek === 0) {
          results.push({
            organizationId: orgId,
            organizationName: orgName,
            success: true,
            error: 'skipped (no data to report)',
          });
          continue;
        }

        const today = new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

        const text = `📋 Myncel Daily Digest — ${today}: ${openCount} open, ${criticalAlerts} critical, ${dueThisWeek} due this week.`;

        const blocks: any[] = [
          {
            type: 'header',
            text: { type: 'plain_text', text: '📋 Myncel Daily Maintenance Digest' },
          },
          {
            type: 'context',
            elements: [{ type: 'mrkdwn', text: `*${today}* · _${orgName}_` }],
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Open Work Orders*\n${openCount}` },
              { type: 'mrkdwn', text: `*Critical Alerts*\n${criticalAlerts}` },
              { type: 'mrkdwn', text: `*Due This Week*\n${dueThisWeek}` },
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
                  .map((w: any) => {
                    const due = w.dueAt ? ` · due ${new Date(w.dueAt).toLocaleDateString()}` : '';
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
              text: `Automated daily digest · <${process.env.NEXTAUTH_URL || 'https://www.myncel.com'}/dashboard|Open Myncel> · <${process.env.NEXTAUTH_URL || 'https://www.myncel.com'}/settings/integrations|Manage digest>`,
            },
          ],
        });

        // === Slack API: chat.postMessage with channel fallback (scope: chat:write) ===
        const postResult = await slackPostWithFallback(
          integration.accessToken!,
          channel,
          text,
          blocks
        );

        if (postResult.ok) {
          results.push({
            organizationId: orgId,
            organizationName: orgName,
            channel: postResult.channel || channel,
            success: true,
            ts: postResult.ts,
          });
        } else {
          results.push({
            organizationId: orgId,
            organizationName: orgName,
            channel,
            success: false,
            error: postResult.friendlyError || postResult.error || 'unknown slack error',
          });
        }
      } catch (err: any) {
        console.error(`[cron slack-digest] Failed for ${orgId}:`, err);
        results.push({
          organizationId: orgId,
          organizationName: orgName,
          success: false,
          error: err?.message || 'unknown error',
        });
      }
    }

    const sent = results.filter(r => r.success && r.ts).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      processed: integrations.length,
      sent,
      failed,
      durationMs: Date.now() - startedAt,
      results,
    });
  } catch (err: any) {
    console.error('[cron slack-digest] Fatal error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'cron failed', durationMs: Date.now() - startedAt },
      { status: 500 }
    );
  }
}
