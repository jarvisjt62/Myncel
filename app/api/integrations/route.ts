import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

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
    docsUrl: '/docs/integrations/slack'
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync maintenance costs, vendor info, and invoices with QuickBooks.',
    icon: '💰',
    category: 'Accounting',
    features: ['Cost tracking', 'Vendor sync', 'Invoice generation'],
    oauthUrl: '/api/integrations/quickbooks/connect',
    docsUrl: '/docs/integrations/quickbooks'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect Myncel to 5,000+ apps with automated workflows.',
    icon: '⚡',
    category: 'Automation',
    features: ['Custom workflows', 'Multi-app automation', 'Trigger actions'],
    apiKeyBased: true,
    docsUrl: '/docs/integrations/zapier'
  },
  {
    id: 'twilio',
    name: 'SMS Notifications',
    description: 'Send work order and alert notifications via SMS using Twilio.',
    icon: '📱',
    category: 'Communication',
    features: ['SMS alerts', 'Work order notifications', 'Critical alerts'],
    configFields: ['accountSid', 'authToken', 'fromNumber'],
    docsUrl: '/docs/integrations/sms'
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Send real-time data to external services via custom webhooks.',
    icon: '🔗',
    category: 'Developer Tools',
    features: ['Real-time events', 'Custom endpoints', 'Event filtering'],
    docsUrl: '/docs/integrations/webhooks'
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    description: 'Export work order data and reports to Google Sheets.',
    icon: '📊',
    category: 'Reporting',
    features: ['Auto-export', 'Custom reports', 'Data sync'],
    oauthUrl: '/api/integrations/google-sheets/connect',
    docsUrl: '/docs/integrations/google-sheets'
  }
];

// GET - List all integrations with their status
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

    // Get existing integrations for this organization
    const existingIntegrations = await safeQuery(
      db.integration.findMany({
        where: { organizationId: user.organizationId },
        select: {
          id: true,
          type: true,
          status: true,
          connectedAt: true,
          lastSyncAt: true,
          config: true,
          webhookUrl: true
        }
      }),
      []
    );

    // Merge with integration types
    const integrations = INTEGRATION_TYPES.map(type => {
      const existing = existingIntegrations.find((i: any) => i.type === type.id.toUpperCase());
      return {
        ...type,
        connected: existing?.status === 'CONNECTED',
        status: existing?.status || 'PENDING',
        connectedAt: existing?.connectedAt,
        lastSyncAt: existing?.lastSyncAt,
        integrationId: existing?.id
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

export { INTEGRATION_TYPES };