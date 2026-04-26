import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const realmId = searchParams.get('realmId'); // QuickBooks company ID
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${baseUrl}/settings/integrations?error=quickbooks_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/settings/integrations?error=quickbooks_invalid`);
  }

  try {
    // Decode state
    let stateData: { orgId: string; integration: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    } catch {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=quickbooks_state_invalid`);
    }

    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=quickbooks_state_expired`);
    }

    if (stateData.integration !== 'quickbooks') {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=quickbooks_state_mismatch`);
    }

    // Find the pending integration
    const existing = await safeQuery(
      db.integration.findFirst({
        where: {
          organizationId: stateData.orgId,
          type: 'QUICKBOOKS',
        },
      }),
      null
    );

    if (!existing) {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=quickbooks_not_found`);
    }

    // Exchange code for tokens
    const credentials = Buffer.from(
      `${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`
    ).toString('base64');

    const tokenRes = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${baseUrl}/api/integrations/quickbooks/callback`,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('QuickBooks token exchange failed:', tokenData.error);
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=quickbooks_token_failed`);
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

    await safeQuery(
      db.integration.update({
        where: { id: existing.id },
        data: {
          status: 'CONNECTED',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: expiresAt,
          config: {
            realmId: realmId || '',
            tokenType: tokenData.token_type || 'bearer',
          },
          connectedAt: new Date(),
        },
      }),
      null
    );

    return NextResponse.redirect(`${baseUrl}/settings/integrations?success=quickbooks_connected`);
  } catch (err) {
    console.error('QuickBooks callback error:', err);
    return NextResponse.redirect(`${baseUrl}/settings/integrations?error=quickbooks_error`);
  }
}