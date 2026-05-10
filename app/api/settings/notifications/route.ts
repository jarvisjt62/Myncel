import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

/**
 * Helper: Get the admin user's organization ID
 */
async function getAdminOrgId(): Promise<string | null> {
  const adminUser = await safeQuery(
    db.user.findFirst({
      where: { email: 'admin@myncel.com' },
      select: { organizationId: true },
    }),
    null
  );
  return adminUser?.organizationId || null;
}

/**
 * Helper: Check if the current user is an admin
 */
async function isCurrentUserAdmin(email: string): Promise<boolean> {
  const adminUser = await safeQuery(
    db.user.findFirst({
      where: { email: 'admin@myncel.com' },
      select: { id: true },
    }),
    null
  );
  return adminUser?.id !== undefined && email === 'admin@myncel.com';
}

// Keys that can be overridden per-org (toggle states)
const TOGGLE_KEYS = [
  'emailWorkOrders', 'emailAlerts', 'emailReports', 'emailDigest',
  'smsEnabled', 'smsWorkOrders', 'smsAlerts', 'smsCriticalOnly',
  'slackEnabled', 'slackWorkOrders', 'slackAlerts',
] as const;

// Keys that are always per-org (never inherited from admin)
const PER_ORG_KEYS = ['phoneNumber', 'slackChannel'] as const;

// GET - Get notification settings for the organization
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run admin check, user lookup, and admin org lookup in parallel
    const [isAdmin, user, adminOrgId] = await Promise.all([
      isCurrentUserAdmin(session.user.email || ''),
      safeQuery(
        db.user.findUnique({
          where: { email: session.user.email || '' },
          select: { organizationId: true }
        }),
        null
      ),
      getAdminOrgId(),
    ]);

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Determine if we need to fetch admin data (for non-admin, different org)
    const needsAdminData = !isAdmin && adminOrgId && adminOrgId !== user.organizationId;

    // Run user settings, user integrations, and admin data fetches in parallel
    const [settingsResult, integrations, adminSettings, adminIntegrations] = await Promise.all([
      safeQuery(
        db.notificationSetting.findUnique({
          where: { organizationId: user.organizationId }
        }),
        null
      ),
      safeQuery(
        db.integration.findMany({
          where: {
            organizationId: user.organizationId,
            type: { in: ['SLACK', 'TWILIO'] },
            status: 'CONNECTED'
          },
          select: { type: true }
        }),
        []
      ),
      // Fetch admin settings in parallel if needed
      needsAdminData
        ? safeQuery(
            db.notificationSetting.findUnique({
              where: { organizationId: adminOrgId! }
            }),
            null
          )
        : Promise.resolve(null),
      // Fetch admin integrations in parallel if needed
      needsAdminData
        ? safeQuery(
            db.integration.findMany({
              where: {
                organizationId: adminOrgId!,
                type: { in: ['SLACK', 'TWILIO'] },
                status: 'CONNECTED',
              },
              select: { type: true },
            }),
            []
          )
        : Promise.resolve([]),
    ]);

    // Create default settings if not exist
    let settings = settingsResult;
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

    // Process integration status
    let hasSlack = (integrations as any[]).some((i: any) => i.type === 'SLACK');
    let hasSms = (integrations as any[]).some((i: any) => i.type === 'TWILIO');
    let smsPlatformManaged = false;
    let slackPlatformManaged = false;

    // Check platform-wide (admin) integrations
    if (!hasSms || !hasSlack) {
      for (const pi of adminIntegrations as any[]) {
        if (pi.type === 'TWILIO' && !hasSms) { hasSms = true; smsPlatformManaged = true; }
        if (pi.type === 'SLACK' && !hasSlack) { hasSlack = true; slackPlatformManaged = true; }
      }
    }

    // For non-admin orgs: merge admin's toggle settings as defaults,
    // but allow org's own settings to override
    let mergedSettings = { ...settings };
    let adminDefaults: Record<string, boolean | string> = {};

    if (needsAdminData && adminSettings) {
      for (const key of TOGGLE_KEYS) {
        if ((adminSettings as any)[key] !== undefined) {
          adminDefaults[key] = (adminSettings as any)[key];
        }
      }
    }

    return NextResponse.json({
      settings: mergedSettings,
      capabilities: {
        email: true,
        slack: hasSlack,
        sms: hasSms,
        smsPlatformManaged,
        slackPlatformManaged,
      },
      adminDefaults, // Frontend uses this to show "Admin default: ON" hints
      isAdmin,
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

    // Build update data — all orgs (including non-admin) can update their own settings
    const updateData: any = {};

    // Toggle keys - any org can set these
    for (const key of TOGGLE_KEYS) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    // Per-org keys - any org can set these
    for (const key of PER_ORG_KEYS) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

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