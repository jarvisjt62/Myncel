import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { checkPlanFeature } from '@/lib/plan-limits';

// Available webhook events
const WEBHOOK_EVENTS = [
  { id: 'work_order.created', name: 'Work Order Created', description: 'Triggered when a new work order is created' },
  { id: 'work_order.updated', name: 'Work Order Updated', description: 'Triggered when a work order is updated' },
  { id: 'work_order.completed', name: 'Work Order Completed', description: 'Triggered when a work order is marked complete' },
  { id: 'work_order.assigned', name: 'Work Order Assigned', description: 'Triggered when a work order is assigned to a user' },
  { id: 'machine.alert', name: 'Machine Alert', description: 'Triggered when a machine has an alert' },
  { id: 'machine.status_changed', name: 'Machine Status Changed', description: 'Triggered when machine status changes' },
  { id: 'maintenance.due', name: 'Maintenance Due', description: 'Triggered when maintenance is due' },
  { id: 'maintenance.overdue', name: 'Maintenance Overdue', description: 'Triggered when maintenance is overdue' },
  { id: 'parts.low_stock', name: 'Parts Low Stock', description: 'Triggered when parts are below minimum quantity' },
  { id: 'user.added', name: 'User Added', description: 'Triggered when a new user joins the organization' }
];

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
 * Helper: Check if the current user is the admin
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

// GET - List all webhooks for the organization, including platform-inherited webhooks from admin
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run user lookup, admin check, and admin org lookup in parallel
    const [user, isAdmin, adminOrgId] = await Promise.all([
      safeQuery(
        db.user.findUnique({
          where: { email: session.user.email || '' },
          select: { organizationId: true }
        }),
        null
      ),
      isCurrentUserAdmin(session.user.email || ''),
      getAdminOrgId(),
    ]);

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const isSameOrgAsAdmin = user.organizationId === adminOrgId;

    // Run user webhooks and admin webhooks fetch in parallel
    const [webhooks, adminWebhooks] = await Promise.all([
      safeQuery(
        db.webhook.findMany({
          where: { organizationId: user.organizationId },
          orderBy: { createdAt: 'desc' }
        }),
        []
      ),
      // Only fetch admin webhooks if needed for platform inheritance
      (!isAdmin && !isSameOrgAsAdmin && adminOrgId)
        ? safeQuery(
            db.webhook.findMany({
              where: { organizationId: adminOrgId, isActive: true },
              orderBy: { createdAt: 'desc' }
            }),
            []
          )
        : Promise.resolve([]),
    ]);

    // Mark own webhooks
    const ownWebhooks = (webhooks as any[]).map((wh: any) => ({
      ...wh,
      platformManaged: false,
    }));

    // Mark platform-inherited webhooks
    const platformWebhooks: any[] = (adminWebhooks as any[]).map((wh: any) => ({
      ...wh,
      platformManaged: true,
      inheritedFrom: 'platform',
      // Don't expose the secret for platform-inherited webhooks
      secret: null,
    }));

    return NextResponse.json({
      webhooks: [...platformWebhooks, ...ownWebhooks],
      availableEvents: WEBHOOK_EVENTS,
      isAdmin,
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new webhook
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, url, events, secret, isActive = true } = body;

    // Validation
    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({
        error: 'Name, URL, and at least one event are required'
      }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Validate events
    const validEventIds = WEBHOOK_EVENTS.map(e => e.id);
    const invalidEvents = events.filter((e: string) => !validEventIds.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json({
        error: `Invalid events: ${invalidEvents.join(', ')}`
      }, { status: 400 });
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

    // Check plan feature: Webhooks require Growth plan or higher
    const featureCheck = await checkPlanFeature(user.organizationId, 'feature.api.webhooks');
    if (!featureCheck.allowed) {
      return NextResponse.json({
        error: 'Webhooks require the Growth plan or higher. Please upgrade to create custom webhooks.',
        code: 'PLAN_FEATURE_REQUIRED',
        feature: 'feature.api.webhooks',
        requiredPlan: featureCheck.requiredPlan,
        currentPlan: featureCheck.plan,
      }, { status: 403 });
    }

    // Generate secret if not provided
    const webhookSecret = secret || generateWebhookSecret();

    // Create webhook
    const webhook = await safeQuery(
      db.webhook.create({
        data: {
          name,
          url,
          events,
          secret: webhookSecret,
          isActive,
          organization: { connect: { id: user.organizationId } }
        }
      }),
      null
    );

    return NextResponse.json({
      webhook,
      secret: webhookSecret,
      message: 'Webhook created successfully. Save the secret - it will not be shown again.'
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a webhook
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, url, events, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 });
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

    // Verify webhook belongs to user's organization (not platform-inherited)
    const existing = await safeQuery(
      db.webhook.findFirst({
        where: { id, organizationId: user.organizationId }
      }),
      null
    );

    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found or is platform-managed' }, { status: 404 });
    }

    // Update webhook
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) {
      try {
        new URL(url);
        updateData.url = url;
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    }
    if (events !== undefined) updateData.events = events;
    if (isActive !== undefined) updateData.isActive = isActive;

    const webhook = await safeQuery(
      db.webhook.update({
        where: { id },
        data: updateData
      }),
      null
    );

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a webhook
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 });
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

    // Verify webhook belongs to user's organization (not platform-inherited)
    const existing = await safeQuery(
      db.webhook.findFirst({
        where: { id, organizationId: user.organizationId }
      }),
      null
    );

    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found or is platform-managed' }, { status: 404 });
    }

    await safeQuery(
      db.webhook.delete({
        where: { id }
      }),
      null
    );

    return NextResponse.json({ success: true, message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateWebhookSecret(): string {
  const prefix = 'whsec_';
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + secret;
}

// Note: WEBHOOK_EVENTS is used internally only - not exported as it conflicts with Next.js Route types