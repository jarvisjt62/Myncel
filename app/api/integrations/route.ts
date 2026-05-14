import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

// Force dynamic rendering — integration status can change at any time and must never be cached
export const dynamic = 'force-dynamic';

// Integration types with metadata
const INTEGRATION_TYPES = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get work order notifications and alerts directly in your Slack channels.',
    icon: '💬',
    category: 'Communication',
    features: ['Work order notifications', 'Alert notifications', 'Daily summaries'],
    oauthUrl: '/api/integrations/slack/connect',
    docsUrl: '/docs/integrations/slack',
    platformWide: true,
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync maintenance costs, vendor info, and invoices with QuickBooks.',
    icon: '💰',
    category: 'Accounting',
    features: ['Cost tracking', 'Vendor sync', 'Invoice generation'],
    oauthUrl: '/api/integrations/quickbooks/connect',
    docsUrl: '/docs/integrations/quickbooks',
    platformWide: true,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect Myncel to 5,000+ apps and automate workflows.',
    icon: '⚡',
    category: 'Automation',
    features: ['Custom workflows', 'Multi-app automation', 'Trigger actions'],
    apiKeyBased: true,
    docsUrl: '/docs/integrations/zapier',
    platformWide: true,
  },
  {
    id: 'twilio',
    name: 'SMS Notifications',
    description: 'Send work order and alert notifications via SMS using Twilio.',
    icon: '📱',
    category: 'Communication',
    features: ['SMS alerts', 'Work order notifications', 'Critical alerts'],
    configFields: ['accountSid', 'authToken', 'fromNumber'],
    docsUrl: '/docs/integrations/sms',
    platformWide: true,
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Send real-time data to external services via custom webhooks.',
    icon: '🔗',
    category: 'Developer Tools',
    features: ['Real-time events', 'Custom endpoints', 'Event filtering'],
    docsUrl: '/docs/integrations/webhooks',
    platformWide: true,
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    description: 'Export work order data and reports to Google Sheets.',
    icon: '📊',
    category: 'Reporting',
    features: ['Auto-export', 'Custom reports', 'Data sync'],
    oauthUrl: '/api/integrations/google-sheets/connect',
    docsUrl: '/docs/integrations/google-sheets',
    platformWide: true,
  }
];

// Platform-wide integrations that are shared across all orgs when configured by admin
const PLATFORM_WIDE_TYPES = new Set(['TWILIO', 'ZAPIER', 'SLACK', 'WEBHOOKS', 'QUICKBOOKS', 'GOOGLE_SHEETS']);

/**
 * Find the platform-level integration for a given type.
 * This is the integration configured by the admin (admin@myncel.com's org).
 */
async function getPlatformIntegration(type: string) {
  // Find the admin user's organization
  const adminUser = await safeQuery(
    db.user.findFirst({
      where: { email: 'admin@myncel.com' },
      select: { organizationId: true },
    }),
    null
  );

  if (!adminUser?.organizationId) return null;

  return safeQuery(
    db.integration.findFirst({
      where: {
        organizationId: adminUser.organizationId,
        type: type as any,
        status: 'CONNECTED',
      },
      select: {
        id: true,
        type: true,
        status: true,
        connectedAt: true,
        lastSyncAt: true,
        config: true,
        webhookUrl: true,
        apiKey: true,
      },
    }),
    null
  );
}

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

// GET - List all integrations with their status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run user lookup and admin org lookup in parallel
    const [user, adminOrgId] = await Promise.all([
      safeQuery(
        db.user.findUnique({
          where: { email: session.user.email || '' },
          select: { organizationId: true, role: true }
        }),
        null
      ),
      getAdminOrgId(),
    ]);

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Platform admin = the admin@myncel.com user (or anyone in the same org as admin@myncel.com)
    const isPlatformAdmin = session.user.email === 'admin@myncel.com';
    const isSameOrgAsAdmin = user.organizationId === adminOrgId;

    // Run user integrations and admin integrations fetch in parallel
    const [existingIntegrations, adminIntegrations] = await Promise.all([
      safeQuery(
        db.integration.findMany({
          where: { organizationId: user.organizationId },
          select: {
            id: true,
            type: true,
            status: true,
            connectedAt: true,
            lastSyncAt: true,
            config: true,
            webhookUrl: true,
          }
        }),
        []
      ),
      // Fetch ALL admin integrations (not just CONNECTED) for platform-wide types
      // We need to know admin's actual status to reflect it properly
      (!isSameOrgAsAdmin && adminOrgId)
        ? safeQuery(
            db.integration.findMany({
              where: {
                organizationId: adminOrgId,
                type: { in: Array.from(PLATFORM_WIDE_TYPES) as any },
              },
              select: {
                id: true,
                type: true,
                status: true,
                connectedAt: true,
                lastSyncAt: true,
                config: true,
                webhookUrl: true,
                apiKey: true,
              }
            }),
            []
          )
        : Promise.resolve([]),
    ]);

    // Build a lookup map for admin integrations by type
    const adminByType = new Map<string, any>();
    for (const ai of adminIntegrations as any[]) {
      adminByType.set(ai.type, ai);
    }

    // Self-healing pre-pass: fix stale integration records for non-admin orgs.
    // If admin has a platform-wide integration CONNECTED and the org has a stale record
    // (e.g., CONNECTED without platformManaged, DISCONNECTED without opt-out, etc.),
    // fix it now so the status returned to the frontend is correct.
    if (!isSameOrgAsAdmin) {
      for (const type of INTEGRATION_TYPES) {
        if (!PLATFORM_WIDE_TYPES.has(type.id.toUpperCase())) continue;
        const adminInt = adminByType.get(type.id.toUpperCase());
        if (adminInt?.status !== 'CONNECTED') continue;

        const existing = (existingIntegrations as any[]).find((i: any) => i.type === type.id.toUpperCase());
        if (!existing) continue; // No record = inherited by default, no fix needed

        const existingConfig = (existing?.config as Record<string, any> | null) || null;
        const hasOptOut = existing.status === 'DISCONNECTED' && existingConfig?.disabledPlatformInheritance === true;
        const hasOptIn = existing.status === 'CONNECTED' && existingConfig?.platformManaged === true;

        if (hasOptOut || hasOptIn) continue; // Already in a known state

        // Stale record detected — heal it
        console.log(`[integrations GET] self-healing ${type.id} for org ${user.organizationId}: existing status=${existing.status}, fixing to CONNECTED+platformManaged`);
        await safeQuery(
          db.integration.upsert({
            where: { organizationId_type: { organizationId: user.organizationId, type: type.id.toUpperCase() as any } },
            create: {
              type: type.id.toUpperCase() as any,
              name: type.name,
              status: 'CONNECTED',
              connectedAt: new Date(),
              config: { platformManaged: true },
              organization: { connect: { id: user.organizationId } },
            },
            update: {
              status: 'CONNECTED',
              connectedAt: new Date(),
              disconnectedAt: null,
              config: { platformManaged: true },
            },
          }),
          null
        ).catch(err => console.error('[integrations GET] self-healing failed:', err));

        // Update the in-memory record so the map below sees the corrected state
        existing.status = 'CONNECTED';
        existing.config = { platformManaged: true };
      }
    }

    // Merge with integration types
    const integrations = INTEGRATION_TYPES.map((type) => {
      const existing = (existingIntegrations as any[]).find((i: any) => i.type === type.id.toUpperCase());
      const isPlatformWide = PLATFORM_WIDE_TYPES.has(type.id.toUpperCase());

      // For non-admin orgs, check if the org has explicitly opted out of platform inheritance
      const hasExplicitOptOut = !isSameOrgAsAdmin && existing?.status === 'DISCONNECTED' &&
        (existing?.config as any)?.disabledPlatformInheritance === true;

      if (isPlatformAdmin || isSameOrgAsAdmin) {
        // Admin user or same org as admin — show their own integration status directly
        return {
          ...type,
          connected: existing?.status === 'CONNECTED',
          status: existing?.status || 'PENDING',
          connectedAt: existing?.connectedAt,
          lastSyncAt: existing?.lastSyncAt,
          integrationId: existing?.id,
          platformInherited: false,
          inheritedFrom: undefined,
          fromNumber: (existing?.config as any)?.fromNumber,
          webhookUrl: existing?.webhookUrl,
          hasApiKey: !!(existing as any)?.apiKey,
          disabledPlatformInheritance: false,
          config: existing?.config,
        };
      }

      // ── Non-admin org logic ──
      // For platform-wide types: always follow admin's status, with per-org enable/disable
      if (isPlatformWide) {
        const adminIntegration = adminByType.get(type.id.toUpperCase());
        const adminIsConnected = adminIntegration?.status === 'CONNECTED';

        // Detect explicit opt-in: org has its OWN CONNECTED record with config.platformManaged = true.
        // This is the refresh-proof persisted state set by /reenable or /twilio/connect.
        const existingConfig = (existing?.config as Record<string, any> | null) || null;
        const hasExplicitOptIn = existing?.status === 'CONNECTED' &&
          existingConfig?.platformManaged === true;

        // Diagnostic logging for Twilio
        if (type.id === 'twilio') {
          console.log(`[integrations GET] twilio: isSameOrgAsAdmin=${isSameOrgAsAdmin} adminIsConnected=${adminIsConnected} existingStatus=${existing?.status} hasExplicitOptIn=${hasExplicitOptIn} hasExplicitOptOut=${hasExplicitOptOut} adminByTypeKeys=${Array.from(adminByType.keys()).join(',')}`);
        }

        if (adminIsConnected && (hasExplicitOptIn || !hasExplicitOptOut)) {
          // Admin has it connected AND (this org explicitly opted in OR hasn't opted out) → Platform Managed
          const cfg = adminIntegration.config as Record<string, any> | null;
          return {
            ...type,
            connected: true,
            status: 'PLATFORM_INHERITED',
            connectedAt: existing?.connectedAt || adminIntegration.connectedAt,
            lastSyncAt: adminIntegration.lastSyncAt,
            integrationId: existing?.id || 'platform',
            platformInherited: true,
            inheritedFrom: 'platform',
            fromNumber: cfg?.fromNumber,
            webhookUrl: adminIntegration.webhookUrl,
            hasApiKey: !!adminIntegration.apiKey,
            disabledPlatformInheritance: false,
            adminConnected: true,
            config: existing?.config,
          };
        } else if (adminIsConnected && hasExplicitOptOut) {
          // Admin has it connected but this org opted out → show as disabled platform integration
          const cfg = adminIntegration.config as Record<string, any> | null;
          return {
            ...type,
            connected: false,
            status: 'PLATFORM_DISABLED',
            connectedAt: adminIntegration.connectedAt,
            lastSyncAt: adminIntegration.lastSyncAt,
            integrationId: 'platform',
            platformInherited: false,
            inheritedFrom: 'platform',
            fromNumber: cfg?.fromNumber,
            webhookUrl: adminIntegration.webhookUrl,
            hasApiKey: !!adminIntegration.apiKey,
            disabledPlatformInheritance: true,
            config: existing?.config,
            adminConnected: true, // Let UI know admin has it connected
          };
        } else {
          // Admin does NOT have it connected → available (not platform-managed)
          console.log(`[integrations GET] ${type.id}: admin NOT connected. adminByType has types: [${Array.from(adminByType.keys()).join(',')}] adminOrgId=${adminOrgId} isSameOrgAsAdmin=${isSameOrgAsAdmin}`);
          return {
            ...type,
            connected: false,
            status: 'PENDING',
            connectedAt: undefined,
            lastSyncAt: undefined,
            integrationId: existing?.id || undefined,
            platformInherited: false,
            inheritedFrom: undefined,
            fromNumber: undefined,
            webhookUrl: undefined,
            hasApiKey: false,
            disabledPlatformInheritance: false,
            adminConnected: false,
            config: existing?.config,
          };
        }
      }

      // For non-platform-wide types: show the org's own integration status
      return {
        ...type,
        connected: existing?.status === 'CONNECTED',
        status: existing?.status || 'PENDING',
        connectedAt: existing?.connectedAt,
        lastSyncAt: existing?.lastSyncAt,
        integrationId: existing?.id,
        platformInherited: false,
        inheritedFrom: undefined,
        fromNumber: undefined,
        webhookUrl: undefined,
        hasApiKey: false,
        disabledPlatformInheritance: false,
        config: existing?.config,
      };
    });

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create/update integration configuration
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, config, apiKey } = body;

    if (!type) {
      return NextResponse.json({ error: 'Integration type is required' }, { status: 400 });
    }

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

    // Check if user is admin or owner
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only admins can configure integrations' }, { status: 403 });
    }

    // For platform-wide types, only the platform admin (admin@myncel.com's org) can create them.
    // Non-admin orgs should use the disconnect/reenable endpoints to toggle platform-inherited integrations.
    const isPlatformWideType = PLATFORM_WIDE_TYPES.has(type.toUpperCase());
    if (isPlatformWideType) {
      const adminOrg = await safeQuery(
        db.user.findFirst({
          where: { email: 'admin@myncel.com' },
          select: { organizationId: true },
        }),
        null
      );
      if (adminOrg?.organizationId && user.organizationId !== adminOrg.organizationId) {
        return NextResponse.json(
          { error: 'This integration is platform-managed. Use the toggle to enable or disable it for your organization.' },
          { status: 403 }
        );
      }
    }

    // For Zapier, generate an API key if not provided
    const integrationData: any = {
      type: type.toUpperCase(),
      name: type.charAt(0).toUpperCase() + type.slice(1),
      organization: { connect: { id: user.organizationId } }
    };

    if (config) {
      integrationData.config = config;
    }

    if (apiKey || type === 'zapier') {
      integrationData.apiKey = apiKey || generateApiKey();
    }

    // Upsert the integration
    const integration = await safeQuery(
      db.integration.upsert({
        where: {
          organizationId_type: {
            organizationId: user.organizationId,
            type: type.toUpperCase() as any
          }
        },
        create: integrationData,
        update: {
          config: config || undefined,
          apiKey: integrationData.apiKey,
          status: 'PENDING'
        }
      }),
      null
    );

    return NextResponse.json({ integration, apiKey: integrationData.apiKey });
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateApiKey(): string {
  const prefix = 'myncel_';
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + key;
}