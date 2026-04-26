import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${baseUrl}/settings/integrations?error=google_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/settings/integrations?error=google_invalid`);
  }

  try {
    let stateData: { orgId: string; integration: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    } catch {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=google_state_invalid`);
    }

    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=google_state_expired`);
    }

    if (stateData.integration !== 'google_sheets') {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=google_state_mismatch`);
    }

    const existing = await safeQuery(
      db.integration.findFirst({
        where: {
          organizationId: stateData.orgId,
          type: 'GOOGLE_SHEETS',
        },
      }),
      null
    );

    if (!existing) {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=google_not_found`);
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${baseUrl}/api/integrations/google-sheets/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('Google token exchange failed:', tokenData.error);
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=google_token_failed`);
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

    // Get user info for display
    let userEmail = '';
    try {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userData = await userRes.json();
      userEmail = userData.email || '';
    } catch {}

    await safeQuery(
      db.integration.update({
        where: { id: existing.id },
        data: {
          status: 'CONNECTED',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || '',
          tokenExpiresAt: expiresAt,
          config: {
            userEmail,
            scope: tokenData.scope || '',
          },
          connectedAt: new Date(),
        },
      }),
      null
    );

    return NextResponse.redirect(`${baseUrl}/settings/integrations?success=google_connected`);
  } catch (err) {
    console.error('Google Sheets callback error:', err);
    return NextResponse.redirect(`${baseUrl}/settings/integrations?error=google_error`);
  }
}