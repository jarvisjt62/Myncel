import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${baseUrl}/settings/integrations?error=slack_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/settings/integrations?error=slack_invalid`);
  }

  try {
    // Decode state to get orgId
    let stateData: { orgId: string; integration: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    } catch {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=slack_state_invalid`);
    }

    // Verify state is not too old (10 minutes)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=slack_state_expired`);
    }

    if (stateData.integration !== 'slack') {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=slack_state_mismatch`);
    }

    // Verify state matches what's in the DB
    const existing = await safeQuery(
      db.integration.findFirst({
        where: {
          organizationId: stateData.orgId,
          type: 'SLACK',
        },
      }),
      null
    );

    if (!existing) {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=slack_not_found`);
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.SLACK_CLIENT_ID || '',
        client_secret: process.env.SLACK_CLIENT_SECRET || '',
        redirect_uri: `${baseUrl}/api/integrations/slack/callback`,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.ok) {
      console.error('Slack token exchange failed:', tokenData.error);
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=slack_token_failed`);
    }

    // Store tokens and channel info
    const accessToken = tokenData.access_token;
    const botToken = tokenData.bot?.bot_access_token || tokenData.access_token;
    const teamName = tokenData.team?.name || tokenData.team_name || '';
    const teamId = tokenData.team?.id || tokenData.team_id || '';
    const defaultChannel = tokenData.incoming_webhook?.channel || '#general';
    const webhookUrl = tokenData.incoming_webhook?.url || '';

    await safeQuery(
      db.integration.update({
        where: { id: existing.id },
        data: {
          status: 'CONNECTED',
          accessToken: botToken,
          webhookUrl,
          config: {
            teamName,
            teamId,
            defaultChannel,
            hasIncomingWebhook: !!webhookUrl,
          },
          connectedAt: new Date(),
        },
      }),
      null
    );

    return NextResponse.redirect(`${baseUrl}/settings/integrations?success=slack_connected`);
  } catch (err) {
    console.error('Slack callback error:', err);
    return NextResponse.redirect(`${baseUrl}/settings/integrations?error=slack_error`);
  }
}