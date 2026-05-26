/**
 * POST /api/integrations/teams/connect
 *   body: { webhookUrl: string, channelName?: string }
 *
 * Validates the URL by sending a real adaptive-card "connection test"
 * message to the channel, then persists the integration.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { sendTeamsAlert } from '@/lib/teams';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await safeQuery(
      () => db.user.findUnique({ where: { id: session.user.id }, select: { organizationId: true } }),
      null
    );
    if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const webhookUrl = String(body.webhookUrl || '').trim();
    const channelName = String(body.channelName || 'Myncel Alerts').trim();

    if (!/^https:\/\/[^/]+\.webhook\.office\.com\//.test(webhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Teams webhook URL. It must be the https://*.webhook.office.com/... URL copied from a channel\'s Incoming Webhook connector.' },
        { status: 400 }
      );
    }

    /* Send a real connection-test card. */
    const testRes = await sendTeamsAlert({
      webhookUrl,
      title: 'Myncel connected to Teams',
      badge: 'Connection test',
      severity: 'success',
      message:
        `This channel is now wired to receive Myncel alerts (work-order assignments, breakdowns, overdue PMs, sensor thresholds). Connected by ${session.user.email}.`,
      facts: [
        { name: 'Organization', value: user.organizationId },
        { name: 'Connected by', value: session.user.email || 'unknown' },
        { name: 'Channel', value: channelName },
      ],
      actions: [
        { title: 'Manage in Myncel', url: 'https://www.myncel.com/settings/integrations' },
      ],
    });

    if (!testRes.ok) {
      return NextResponse.json(
        {
          error: 'Microsoft Teams rejected the webhook',
          detail: testRes.error || `HTTP ${testRes.status}`,
        },
        { status: 400 }
      );
    }

    /* Persist. We store the URL in webhookUrl (existing column). */
    const existing = await safeQuery(
      () =>
        db.integration.findFirst({
          where: { organizationId: user.organizationId, type: 'MS_TEAMS' as any },
        }),
      null
    );

    if (existing) {
      await db.integration.update({
        where: { id: existing.id },
        data: {
          status: 'CONNECTED',
          name: `Microsoft Teams — ${channelName}`,
          config: { channelName },
          webhookUrl,
          connectedAt: new Date(),
          disconnectedAt: null,
        },
      });
    } else {
      await db.integration.create({
        data: {
          organizationId: user.organizationId,
          type: 'MS_TEAMS' as any,
          name: `Microsoft Teams — ${channelName}`,
          status: 'CONNECTED',
          config: { channelName },
          webhookUrl,
          connectedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Teams connected. A confirmation card was just posted to your channel.',
    });
  } catch (err: any) {
    console.error('[teams/connect]', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
