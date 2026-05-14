import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

// Platform-wide integration types
const PLATFORM_WIDE_TYPES = new Set(['TWILIO', 'ZAPIER', 'SLACK', 'WEBHOOKS', 'QUICKBOOKS', 'GOOGLE_SHEETS']);

// POST - Re-enable a platform-inherited integration that was previously disabled by this org,
// OR enable a platform-managed integration for an org that hasn't set it up yet.
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

      // Find any existing record for this org
      const existingIntegration = await safeQuery(
        db.integration.findFirst({
          where: {
            organizationId: user.organizationId,
            type: integrationId as any,
          }
        }),
        null
      );

      if (existingIntegration) {
        const config = existingIntegration.config as Record<string, any> | null;
        const hasExplicitOptOut = config?.disabledPlatformInheritance === true;

        if (hasExplicitOptOut) {
          // This was a platform opt-out. Delete the DISCONNECTED record so the org
          // will again inherit the platform default.
          await safeQuery(
            db.integration.delete({
              where: { id: existingIntegration.id },
            }),
            null
          );
        } else if (existingIntegration.status === 'DISCONNECTED') {
          // Was disconnected without opt-out flag — just delete so platform inheritance kicks in
          await safeQuery(
            db.integration.delete({
              where: { id: existingIntegration.id },
            }),
            null
          );
        }
        // If it's already CONNECTED, nothing to do
      }
      // If no existing record, that's fine — the absence of a record means
      // the org inherits the platform default (which is CONNECTED).

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

    // Remove the opt-out record
    await safeQuery(
      db.integration.delete({
        where: { id: integration.id },
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
