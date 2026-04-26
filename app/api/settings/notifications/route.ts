import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

// GET - Get notification settings for the organization
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { organizationId: true }
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get notification settings
    let settings = await safeQuery(
      db.notificationSetting.findUnique({
        where: { organizationId: user.organizationId }
      }),
      null
    );

    // Create default settings if not exist
    if (!settings) {
      settings = await safeQuery(
        db.notificationSetting.create({
          data: {
            organization: { connect: { id: user.organizationId } }
          }
        }),
        null
      );
    }

    // Get integration status for Slack and SMS
    const integrations = await safeQuery(
      db.integration.findMany({
        where: {
          organizationId: user.organizationId,
          type: { in: ['SLACK', 'TWILIO'] },
          status: 'CONNECTED'
        },
        select: { type: true }
      }),
      []
    );

    const hasSlack = integrations.some((i: any) => i.type === 'SLACK');
    const hasSms = integrations.some((i: any) => i.type === 'TWILIO');

    return NextResponse.json({
      settings,
      capabilities: {
        email: true, // Email is always available
        slack: hasSlack,
        sms: hasSms
      }
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update notification settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      // Email settings
      emailWorkOrders,
      emailAlerts,
      emailReports,
      emailDigest,
      // SMS settings
      smsEnabled,
      smsWorkOrders,
      smsAlerts,
      smsCriticalOnly,
      phoneNumber,
      // Slack settings
      slackEnabled,
      slackWorkOrders,
      slackAlerts,
      slackChannel
    } = body;

    // Get user's organization
    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { organizationId: true, role: true }
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    
    // Email settings
    if (emailWorkOrders !== undefined) updateData.emailWorkOrders = emailWorkOrders;
    if (emailAlerts !== undefined) updateData.emailAlerts = emailAlerts;
    if (emailReports !== undefined) updateData.emailReports = emailReports;
    if (emailDigest !== undefined) updateData.emailDigest = emailDigest;
    
    // SMS settings
    if (smsEnabled !== undefined) updateData.smsEnabled = smsEnabled;
    if (smsWorkOrders !== undefined) updateData.smsWorkOrders = smsWorkOrders;
    if (smsAlerts !== undefined) updateData.smsAlerts = smsAlerts;
    if (smsCriticalOnly !== undefined) updateData.smsCriticalOnly = smsCriticalOnly;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    
    // Slack settings
    if (slackEnabled !== undefined) updateData.slackEnabled = slackEnabled;
    if (slackWorkOrders !== undefined) updateData.slackWorkOrders = slackWorkOrders;
    if (slackAlerts !== undefined) updateData.slackAlerts = slackAlerts;
    if (slackChannel !== undefined) updateData.slackChannel = slackChannel;

    // Upsert settings
    const settings = await safeQuery(
      db.notificationSetting.upsert({
        where: { organizationId: user.organizationId },
        create: {
          ...updateData,
          organization: { connect: { id: user.organizationId } }
        },
        update: updateData
      }),
      null
    );

    return NextResponse.json({
      success: true,
      settings,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}