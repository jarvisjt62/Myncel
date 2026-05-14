import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

// Platform-wide integration types
const PLATFORM_WIDE_TYPES = new Set(['TWILIO', 'ZAPIER', 'SLACK', 'WEBHOOKS', 'QUICKBOOKS', 'GOOGLE_SHEETS']);

// POST - Re-enable a platform-inherited integration that was previously disabled by this org,
// OR enable a platform-managed integration for an org that hasn't set it up yet.
//
// IMPORTANT: To make the enabled state refresh-proof, we now persist an EXPLICIT
// CONNECTED record for the org with config.platformManaged = true. The GET endpoint
// knows how to treat that as PLATFORM_INHERITED so the UI still shows the correct
// "platform-managed" affordance.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrationId = params.id.toUpperCase();

    // Get user's organization and admin org in parallel
    const [user, adminOrg] = await Promise.all([
      safeQuery(
        db.user.findUnique({
          where: { email: session.user.email || '' },
          select: { organizationId: true, role: true }
        }),
        null
      ),
      safeQuery(
        db.user.findFirst({
          where: { email: 'admin@myncel.com' },
          select: { organizationId: true },
        }),
        null
      ),
    ]);

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Check if user is admin or owner of their org
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only org admins can re-enable integrations' }, { status: 403 });
    }

    const isPlatformWide = PLATFORM_WIDE_TYPES.has(integrationId);
    const isSameOrgAsAdmin = user.organizationId === adminOrg?.organizationId;

    // For platform-wide types: if the admin org has it connected, non-admin orgs can opt in
    if (isPlatformWide && !isSameOrgAsAdmin && adminOrg?.organizationId) {
      // Verify admin has this integration connected
      const adminIntegration = await safeQuery(
        db.integration.findFirst({
          where: {
            organizationId: adminOrg.organizationId,
            type: integrationId as any,
            status: 'CONNECTED',
          }
        }),
        null
      );

      if (!adminIntegration) {
        return NextResponse.json({
          error: 'This integration is not available at the platform level. Ask your platform admin to configure it first.',
        }, { status: 400 });
      }

      // Persist an EXPLICIT CONNECTED record for this org with platformManaged: true.
      // This survives browser refreshes and makes the enabled state unambiguous.
      await safeQuery(
        db.integration.upsert({
          where: {
            organizationId_type: {
              organizationId: user.organizationId,
              type: integrationId as any,
            },
          },
          create: {
            type: integrationId as any,
            name: integrationId === 'TWILIO' ? 'SMS Notifications' : integrationId,
            status: 'CONNECTED',
            connectedAt: new Date(),
            config: { platformManaged: true } as any,
            organization: { connect: { id: user.organizationId } },
          },
          update: {
            status: 'CONNECTED',
            connectedAt: new Date(),
            disconnectedAt: null,
            config: { platformManaged: true } as any,
          },
        }),
        null
      );

      // Also auto-enable SMS in notification settings if this is Twilio
      if (integrationId === 'TWILIO') {
        await safeQuery(
          db.notificationSetting.upsert({
            where: { organizationId: user.organizationId },
            create: {
              smsEnabled: true,
              smsWorkOrders: true,
              smsAlerts: true,
              organization: { connect: { id: user.organizationId } },
            },
            update: {
              smsEnabled: true,
              smsWorkOrders: true,
              smsAlerts: true,
            },
          }),
          null
        );
      }

      return NextResponse.json({
        success: true,
        message: `${params.id} integration enabled. It will use the platform configuration.`,
      });
    }

    // For admin org or non-platform-wide types: look for a disabled integration to re-enable
    const integration = await safeQuery(
      db.integration.findFirst({
        where: {
          organizationId: user.organizationId,
          type: integrationId as any,
          status: 'DISCONNECTED',
        }
      }),
      null
    );

    if (!integration) {
      return NextResponse.json({ error: 'No disabled integration found to re-enable' }, { status: 404 });
    }

    const config = integration.config as Record<string, any> | null;
    const hasExplicitOptOut = config?.disabledPlatformInheritance === true;

    if (!hasExplicitOptOut) {
      return NextResponse.json({
        error: 'This integration was disconnected, not disabled from platform default. Use the Connect button to reconnect.',
        useConnectFlow: true,
      }, { status: 400 });
    }

    // Flip the opt-out record back to CONNECTED and mark it as platform-managed
    const { disabledPlatformInheritance, ...restConfig } = config || {};
    await safeQuery(
      db.integration.update({
        where: { id: integration.id },
        data: {
          status: 'CONNECTED',
          connectedAt: new Date(),
          disconnectedAt: null,
          config: { ...restConfig, platformManaged: true } as any,
        },
      }),
      null
    );

    // Also auto-enable SMS in notification settings if this is Twilio
    if (integrationId === 'TWILIO') {
      await safeQuery(
        db.notificationSetting.upsert({
          where: { organizationId: user.organizationId },
          create: {
            smsEnabled: true,
            smsWorkOrders: true,
            smsAlerts: true,
            organization: { connect: { id: user.organizationId } },
          },
          update: {
            smsEnabled: true,
            smsWorkOrders: true,
            smsAlerts: true,
          },
        }),
        null
      );
    }

    return NextResponse.json({
      success: true,
      message: `${params.id} integration re-enabled. It will now inherit from the platform default.`,
    });
  } catch (error) {
    console.error('Error re-enabling integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
