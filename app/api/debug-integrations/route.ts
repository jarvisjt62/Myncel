import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Comprehensive integrations diagnostic endpoint.
 * Shows EXACTLY what's in the database and how it maps to the UI state.
 *
 * GET /api/debug-integrations               -> diagnose state (no side effects)
 * POST /api/debug-integrations { fix: true } -> auto-fix: create missing platformManaged records
 */
export async function GET(req: NextRequest) {
  return runDiagnostic(false);
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  return runDiagnostic(!!body.fix);
}

async function runDiagnostic(fix: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report: any = {
      timestamp: new Date().toISOString(),
      sessionUser: {
        email: session.user.email,
        organizationId: (session.user as any).organizationId,
        organizationName: (session.user as any).organizationName,
        role: (session.user as any).role,
      },
      diagnosis: [] as string[],
      actions: [] as string[],
    };

    // Step 1: Look up the user in the DB (don't trust the JWT)
    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          organizationId: true,
          role: true,
          organization: { select: { id: true, name: true } },
        },
      }),
      null
    );

    report.dbUser = user;

    if (!user?.organizationId) {
      report.diagnosis.push('❌ User has no organizationId in the database');
      return NextResponse.json(report);
    }

    // Step 2: Look up admin@myncel.com
    const adminUser = await safeQuery(
      db.user.findFirst({
        where: { email: 'admin@myncel.com' },
        select: {
          id: true,
          email: true,
          organizationId: true,
          organization: { select: { id: true, name: true } },
        },
      }),
      null
    );

    report.adminUser = adminUser;

    if (!adminUser) {
      report.diagnosis.push('❌ admin@myncel.com user does NOT exist in the database. Platform inheritance will fail.');
    } else if (!adminUser.organizationId) {
      report.diagnosis.push('❌ admin@myncel.com has no organizationId. Platform inheritance will fail.');
    }

    const adminOrgId = adminUser?.organizationId || null;
    const isSameOrgAsAdmin = user.organizationId === adminOrgId;
    report.isSameOrgAsAdmin = isSameOrgAsAdmin;

    if (isSameOrgAsAdmin) {
      report.diagnosis.push('ℹ️ This user is in the admin\'s organization. The integrations page will show this org\'s OWN integration records (not platform-inherited).');
    }

    // Step 3: Get all integration records for this org
    const orgIntegrations = await safeQuery(
      db.integration.findMany({
        where: { organizationId: user.organizationId },
        select: {
          id: true,
          type: true,
          status: true,
          connectedAt: true,
          disconnectedAt: true,
          config: true,
        },
      }),
      []
    );

    report.orgIntegrations = (orgIntegrations as any[]).map((i: any) => ({
      type: i.type,
      status: i.status,
      connectedAt: i.connectedAt,
      disconnectedAt: i.disconnectedAt,
      platformManaged: (i.config as any)?.platformManaged || false,
      disabledPlatformInheritance: (i.config as any)?.disabledPlatformInheritance || false,
      hasCredentials: !!((i.config as any)?.accountSid && (i.config as any)?.authToken),
      configKeys: i.config ? Object.keys(i.config as any) : [],
    }));

    // Step 4: Get all integration records for the admin org
    let adminIntegrations: any[] = [];
    if (adminOrgId) {
      adminIntegrations = (await safeQuery(
        db.integration.findMany({
          where: { organizationId: adminOrgId },
          select: {
            id: true,
            type: true,
            status: true,
            connectedAt: true,
            config: true,
          },
        }),
        []
      )) as any[];
    }

    report.adminIntegrations = adminIntegrations.map((i: any) => ({
      type: i.type,
      status: i.status,
      connectedAt: i.connectedAt,
      hasCredentials: !!((i.config as any)?.accountSid && (i.config as any)?.authToken),
      fromNumber: (i.config as any)?.fromNumber,
    }));

    // Step 5: Predict what each integration will look like in the UI
    const PLATFORM_WIDE = ['TWILIO', 'ZAPIER', 'SLACK', 'WEBHOOKS', 'QUICKBOOKS', 'GOOGLE_SHEETS'];
    report.predictedUiStatus = {};

    for (const type of PLATFORM_WIDE) {
      const orgInt = (orgIntegrations as any[]).find((i: any) => i.type === type);
      const adminInt = adminIntegrations.find((i: any) => i.type === type);
      const orgConfig = orgInt?.config as any;
      const adminIsConnected = adminInt?.status === 'CONNECTED';
      const hasOptIn = orgInt?.status === 'CONNECTED' && orgConfig?.platformManaged === true;
      const hasOptOut = orgInt?.status === 'DISCONNECTED' && orgConfig?.disabledPlatformInheritance === true;

      let predicted: string;
      let reason: string;

      if (isSameOrgAsAdmin) {
        predicted = orgInt?.status || 'PENDING';
        reason = 'Admin org path: shows own integration status';
      } else if (hasOptIn) {
        predicted = 'PLATFORM_INHERITED';
        reason = 'PRIORITY 1: explicit opt-in (CONNECTED + platformManaged)';
      } else if (hasOptOut) {
        predicted = 'PLATFORM_DISABLED';
        reason = 'PRIORITY 2: explicit opt-out (DISCONNECTED + disabledPlatformInheritance)';
      } else if (adminIsConnected) {
        predicted = 'PLATFORM_INHERITED';
        reason = 'PRIORITY 3: default inheritance (admin connected, no preference)';
      } else {
        predicted = 'PENDING';
        reason = 'PRIORITY 4: admin NOT connected, no preference';
      }

      report.predictedUiStatus[type] = {
        predicted,
        reason,
        orgRecord: orgInt ? {
          status: orgInt.status,
          platformManaged: orgConfig?.platformManaged || false,
          disabledPlatformInheritance: orgConfig?.disabledPlatformInheritance || false,
        } : null,
        adminRecord: adminInt ? {
          status: adminInt.status,
        } : null,
      };
    }

    // Step 6: Optional fix mode — create missing platformManaged records for non-admin orgs
    if (fix && !isSameOrgAsAdmin && adminOrgId) {
      for (const type of PLATFORM_WIDE) {
        const adminInt = adminIntegrations.find((i: any) => i.type === type);
        if (adminInt?.status !== 'CONNECTED') continue;

        const orgInt = (orgIntegrations as any[]).find((i: any) => i.type === type);
        const orgConfig = orgInt?.config as any;
        const hasOptIn = orgInt?.status === 'CONNECTED' && orgConfig?.platformManaged === true;
        const hasOptOut = orgInt?.status === 'DISCONNECTED' && orgConfig?.disabledPlatformInheritance === true;

        if (hasOptIn || hasOptOut) {
          report.actions.push(`ℹ️ ${type}: already in known state (${hasOptIn ? 'opted in' : 'opted out'}), skipping`);
          continue;
        }

        // Either no record or stale record — fix it
        const result = await safeQuery(
          db.integration.upsert({
            where: { organizationId_type: { organizationId: user.organizationId, type: type as any } },
            create: {
              type: type as any,
              name: type,
              status: 'CONNECTED',
              connectedAt: new Date(),
              config: { platformManaged: true },
              organizationId: user.organizationId,
            },
            update: {
              status: 'CONNECTED',
              connectedAt: new Date(),
              disconnectedAt: null,
              config: { platformManaged: true },
            },
          }),
          null
        );

        if (result) {
          report.actions.push(`✅ ${type}: ${orgInt ? 'fixed stale' : 'created'} CONNECTED + platformManaged record`);
        } else {
          report.actions.push(`❌ ${type}: failed to create/fix record`);
        }
      }

      // Also enable SMS notification settings if Twilio was fixed
      const twilioFixed = report.actions.some((a: string) => a.includes('TWILIO') && a.startsWith('✅'));
      if (twilioFixed) {
        await safeQuery(
          db.notificationSetting.upsert({
            where: { organizationId: user.organizationId },
            create: {
              organizationId: user.organizationId,
              smsEnabled: true,
              smsWorkOrders: true,
              smsAlerts: true,
            },
            update: {
              smsEnabled: true,
              smsWorkOrders: true,
              smsAlerts: true,
            },
          }),
          null
        );
        report.actions.push('✅ NotificationSettings: smsEnabled=true, smsWorkOrders=true, smsAlerts=true');
      }
    }

    // Step 7: Final summary
    report.summary = {
      orgIntegrationCount: (orgIntegrations as any[]).length,
      adminIntegrationCount: adminIntegrations.length,
      adminTwilioConnected: adminIntegrations.some((i: any) => i.type === 'TWILIO' && i.status === 'CONNECTED'),
      orgTwilioRecord: (orgIntegrations as any[]).find((i: any) => i.type === 'TWILIO') ? 'exists' : 'missing',
    };

    return NextResponse.json(report, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || 'Unknown error',
      stack: error?.stack,
    }, { status: 500 });
  }
}
