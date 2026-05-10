import { NextRequest, NextResponse } from 'next/server';
import { sendSmsNotification } from '@/lib/notifications/sms';
import { db, safeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/test-sms — Send a test SMS (for development/diagnostic testing)
export async function POST(req: NextRequest) {
  try {
    const { organizationId, toNumber } = await req.json();

    if (!organizationId || !toNumber) {
      return NextResponse.json({ error: 'organizationId and toNumber are required' }, { status: 400 });
    }

    // First check if Twilio is configured for this org
    const integration = await safeQuery(
      db.integration.findFirst({
        where: {
          organizationId,
          type: 'TWILIO',
          status: 'CONNECTED',
        },
      }),
      null
    );

    if (!integration) {
      return NextResponse.json({ 
        error: 'Twilio not configured for this organization',
        found: false
      }, { status: 404 });
    }

    const config = integration.config as Record<string, any>;
    const testMessage = `[Myncel Test] SMS integration is working! Timestamp: ${new Date().toISOString()}. This is a test message to verify your Twilio setup.`;

    const result = await sendSmsNotification(organizationId, toNumber, testMessage);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test SMS sent successfully!',
        sid: result.sid,
        to: toNumber,
        from: config?.fromNumber,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        to: toNumber,
        from: config?.fromNumber,
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Test SMS error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// GET /api/test-sms — Check Twilio configuration status (no auth for debug mode in development)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const integration = await safeQuery(
      db.integration.findFirst({
        where: {
          organizationId,
          type: 'TWILIO',
        },
      }),
      null
    );

    if (!integration) {
      return NextResponse.json({ 
        configured: false, 
        status: 'NOT_CONFIGURED' 
      });
    }

    const config = integration.config as Record<string, any>;

    return NextResponse.json({
      configured: true,
      status: integration.status,
      hasCredentials: !!(config?.accountSid && config?.authToken),
      fromNumber: config?.fromNumber,
      // Mask sensitive values
      accountSidPrefix: config?.accountSid?.substring(0, 8) + '...',
      connectedAt: integration.connectedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}