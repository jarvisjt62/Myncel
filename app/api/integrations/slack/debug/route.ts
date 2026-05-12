/**
 * GET /api/integrations/slack/debug
 *
 * Admin-only diagnostic endpoint.
 * Returns the stored integration config and live Slack API results
 * so we can see exactly why posting is failing.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, organizationId: true, email: true },
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Find org's own integration
    const ownIntegration = await safeQuery(
      db.integration.findFirst({
        where: { organizationId: user.organizationId, type: 'SLACK' },
      }),
      null
    );

    // Find admin org integration
    const adminUser = await safeQuery(
      db.user.findFirst({
        where: { email: 'admin@myncel.com' },
        select: { organizationId: true },
      }),
      null
    );
    const adminIntegration = adminUser?.organizationId
      ? await safeQuery(
          db.integration.findFirst({
            where: { organizationId: adminUser.organizationId, type: 'SLACK' },
          }),
          null
        )
      : null;

    const effectiveIntegration =
      (ownIntegration?.status === 'CONNECTED' ? ownIntegration : null) ||
      (adminIntegration?.status === 'CONNECTED' ? adminIntegration : null);

    const dbInfo = {
      ownIntegration: ownIntegration
        ? {
            id: ownIntegration.id,
            status: ownIntegration.status,
            hasAccessToken: !!ownIntegration.accessToken,
            tokenLength: ownIntegration.accessToken?.length ?? 0,
            tokenPrefix: ownIntegration.accessToken?.slice(0, 12) ?? null,
            config: ownIntegration.config,
            connectedAt: ownIntegration.connectedAt,
          }
        : null,
      adminIntegration: adminIntegration
        ? {
            id: adminIntegration.id,
            status: adminIntegration.status,
            hasAccessToken: !!adminIntegration.accessToken,
            tokenLength: adminIntegration.accessToken?.length ?? 0,
            tokenPrefix: adminIntegration.accessToken?.slice(0, 12) ?? null,
            config: adminIntegration.config,
            connectedAt: adminIntegration.connectedAt,
          }
        : null,
      effectiveSource: ownIntegration?.status === 'CONNECTED'
        ? 'own'
        : adminIntegration?.status === 'CONNECTED'
        ? 'admin'
        : 'none',
    };

    if (!effectiveIntegration?.accessToken) {
      return NextResponse.json({ dbInfo, liveTests: null, error: 'No connected integration found' });
    }

    const token = effectiveIntegration.accessToken;
    const cfg = (effectiveIntegration.config as any) || {};

    // Run live Slack API calls
    const slackGet = async (path: string) => {
      const r = await fetch(`https://slack.com/api/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return r.json().catch(() => ({ ok: false, error: 'json_parse_error' }));
    };

    // 1. auth.test — tells us who the bot is and what workspace
    const authTest = await slackGet('auth.test');

    // 2. conversations.list — what channels can the bot see?
    const convList = await slackGet(
      'conversations.list?exclude_archived=true&types=public_channel,private_channel&limit=50'
    );
    const channels = Array.isArray(convList.channels) ? convList.channels : [];
    const channelSummary = channels.map((c: any) => ({
      id: c.id,
      name: c.name,
      is_member: c.is_member,
      is_general: c.is_general,
      is_private: c.is_private,
      is_archived: c.is_archived,
    }));
    const memberChannels = channelSummary.filter((c: any) => c.is_member);

    // 3. Try a test post to the configured channel
    const targetChannel = cfg.defaultChannel || '#general';
    const testPostRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: targetChannel,
        text: '🔧 Myncel Slack debug test — if you see this, posting works!',
      }),
    });
    const testPost = await testPostRes.json().catch(() => ({ ok: false }));

    // 4. If test post failed and we have member channels, try the first one
    let fallbackPost: any = null;
    if (!testPost.ok && memberChannels.length > 0) {
      const fb = memberChannels[0];
      const fbRes = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: fb.id,
          text: `🔧 Myncel debug fallback test → posted to #${fb.name} because ${targetChannel} failed with "${testPost.error}"`,
        }),
      });
      fallbackPost = await fbRes.json().catch(() => ({ ok: false }));
    }

    return NextResponse.json({
      dbInfo,
      liveTests: {
        authTest: {
          ok: authTest.ok,
          error: authTest.error,
          user: authTest.user,
          user_id: authTest.user_id,
          team: authTest.team,
          team_id: authTest.team_id,
          bot_id: authTest.bot_id,
        },
        conversations: {
          ok: convList.ok,
          error: convList.error,
          totalVisible: channels.length,
          memberCount: memberChannels.length,
          memberChannels,
          allChannels: channelSummary,
        },
        testPost: {
          targetChannel,
          ok: testPost.ok,
          error: testPost.error,
          ts: testPost.ts,
          channel: testPost.channel,
        },
        fallbackPost: fallbackPost
          ? {
              targetChannel: memberChannels[0]?.name,
              ok: fallbackPost.ok,
              error: fallbackPost.error,
              ts: fallbackPost.ts,
            }
          : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
