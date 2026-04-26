import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json({ error: 'Configuration is required' }, { status: 400 });
    }

    const { accountSid, authToken, fromNumber } = config;

    // Validate
    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: 'Account SID, Auth Token, and From Number are required' }, { status: 400 });
    }

    if (!/^\+\d{10,15}$/.test(fromNumber)) {
      return NextResponse.json({ error: 'From Number must be in E.164 format (e.g., +12125551234)' }, { status: 400 });
    }

    if (!accountSid.startsWith('AC')) {
      return NextResponse.json({ error: 'Account SID must start with "AC"' }, { status: 400 });
    }

    // Get user's organization
    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { organizationId: true, role: true },
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Only ADMIN or OWNER can configure integrations
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only admins and owners can configure integrations' }, { status: 403 });
    }

    // Optionally verify credentials with Twilio API
    let twilioVerified = false;
    try {
      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          },
        }
      );
      twilioVerified = twilioRes.ok;
      if (!twilioRes.ok) {
        const errorData = await twilioRes.json().catch(() => ({}));
        return NextResponse.json({
          error: 'Invalid Twilio credentials. Please check your Account SID and Auth Token.',
        }, { status: 400 });
      }
    } catch (err) {
      // Network error — save anyway, will fail at send time
      console.warn('Could not verify Twilio credentials:', err);
    }

    // Save configuration
    const integration = await safeQuery(
      db.integration.upsert({
        where: {
          organizationId_type: {
            organizationId: user.organizationId,
            type: 'TWILIO',
          },
        },
        create: {
          type: 'TWILIO',
          name: 'SMS Notifications',
          status: 'CONNECTED',
          connectedAt: new Date(),
          config: {
            accountSid,
            authToken, // In production, encrypt this
            fromNumber,
            verified: twilioVerified,
          },
          organization: { connect: { id: user.organizationId } },
        },
        update: {
          status: 'CONNECTED',
          connectedAt: new Date(),
          config: {
            accountSid,
            authToken,
            fromNumber,
            verified: twilioVerified,
          },
        },
      }),
      null
    );

    if (!integration) {
      return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        type: integration.type,
        status: integration.status,
        connectedAt: integration.connectedAt,
      },
    });
  } catch (error) {
    console.error('Error saving Twilio config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}