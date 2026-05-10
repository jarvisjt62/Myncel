import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Generate a secure API key
function generateApiKey(prefix = 'mnc'): string {
  const random = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${random}`;
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

// GET — list all API keys for the org, including platform-inherited keys from admin
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run admin checks and user keys fetch in parallel to reduce latency
    const [isAdmin, adminOrgId, keys] = await Promise.all([
      isCurrentUserAdmin(session.user.email || ''),
      getAdminOrgId(),
      safeQuery(
        db.integration.findMany({
          where: {
            organizationId: session.user.organizationId,
            type: 'ZAPIER',
          },
          select: {
            id: true,
            name: true,
            status: true,
            apiKey: true,
            createdAt: true,
            updatedAt: true,
            config: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        []
      ),
    ]);

    const isSameOrgAsAdmin = session.user.organizationId === adminOrgId;

    // Mask the key — only show first 16 + last 4 chars
    const maskedKeys = keys.map((k: any) => ({
      ...k,
      apiKeyMasked: k.apiKey
        ? `${k.apiKey.slice(0, 16)}...${k.apiKey.slice(-4)}`
        : null,
      apiKeyFull: k.apiKey, // included so UI can copy once
      lastUsed: (k.config as any)?.lastUsed || null,
      usageCount: (k.config as any)?.usageCount || 0,
      platformManaged: false,
    }));

    // For non-admin orgs that are NOT the same org as admin:
    // include admin's CONNECTED Zapier API keys as platform-managed,
    // but ONLY if:
    //   1. Admin actually has Zapier CONNECTED (syncs with admin's status)
    //   2. The user's org has NOT opted out of platform inheritance
    //   3. The user's org has NO own Zapier records (avoid duplicates)
    let platformKeys: any[] = [];
    const orgHasOwnZapierKeys = keys.length > 0;
    const orgHasOptedOut = keys.some(
      (k: any) => k.status === 'DISCONNECTED' && (k.config as any)?.disabledPlatformInheritance === true
    );
    if (!isAdmin && !isSameOrgAsAdmin && !orgHasOwnZapierKeys && !orgHasOptedOut) {
      if (adminOrgId) {
        // Only fetch if admin has Zapier actually CONNECTED
        // If admin disconnected, there will be no CONNECTED records → no platform key shown
        const adminIntegrations = await safeQuery(
          db.integration.findMany({
            where: {
              organizationId: adminOrgId,
              type: 'ZAPIER',
              status: 'CONNECTED', // Only include active keys — syncs with admin status
            },
            select: {
              id: true,
              name: true,
              status: true,
              apiKey: true,
              createdAt: true,
              updatedAt: true,
              config: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
          []
        );

        platformKeys = adminIntegrations.map((k: any) => ({
          ...k,
          apiKeyMasked: k.apiKey
            ? `${k.apiKey.slice(0, 16)}...${k.apiKey.slice(-4)}`
            : null,
          apiKeyFull: null, // Don't expose full admin API key to non-admin users
          lastUsed: (k.config as any)?.lastUsed || null,
          usageCount: (k.config as any)?.usageCount || 0,
          platformManaged: true,
          inheritedFrom: 'platform',
        }));
      }
    }

    // Also handle the case where user's org has stale own Zapier records
    // but admin has disconnected — in that case, the user's records should
    // reflect admin's status (not show as active when admin turned them off)
    if (!isAdmin && !isSameOrgAsAdmin && orgHasOwnZapierKeys && adminOrgId) {
      const adminZapierConnected = await safeQuery(
        db.integration.findFirst({
          where: {
            organizationId: adminOrgId,
            type: 'ZAPIER',
            status: 'CONNECTED',
          },
          select: { id: true },
        }),
        null
      );

      // If admin does NOT have Zapier connected, filter out user's own
      // Zapier keys from the response — they should not see keys for a
      // platform-wide integration that admin has turned off
      if (!adminZapierConnected) {
        // Check if user's keys are truly their own or just stale platform records
        const hasExplicitOwnKey = keys.some(
          (k: any) => k.status === 'CONNECTED' && !(k.config as any)?.disabledPlatformInheritance
        );

        if (!hasExplicitOwnKey) {
          // All user's Zapier records are disconnected/opted-out —
          // don't show any Zapier keys at all
          maskedKeys.length = 0;
        }
        // If user has some connected keys but admin disconnected,
        // still show them but mark as "no longer platform-managed"
        // (admin may have disconnected at platform level but org has own usage)
      }
    }

    return NextResponse.json({
      keys: [...maskedKeys, ...platformKeys],
      isAdmin,
    });
  } catch (error) {
    console.error('GET api-keys error:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

// POST — create a new API key
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, type } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 });
    }

    // Zapier is a platform-wide integration — only the platform admin org can create API keys.
    // Non-admin orgs should use the platform-inherited Zapier integration managed by admin.
    const [isAdminUser, adminOrgId] = await Promise.all([
      isCurrentUserAdmin(session.user.email || ''),
      getAdminOrgId(),
    ]);
    if (!isAdminUser && adminOrgId && session.user.organizationId !== adminOrgId) {
      return NextResponse.json(
        { error: 'Zapier API keys are platform-managed. Use the integration toggle to enable or disable for your organization.' },
        { status: 403 }
      );
    }

    // Check key limit (max 10 keys per org)
    const count = await db.integration.count({
      where: { organizationId: session.user.organizationId, type: 'ZAPIER' },
    });
    if (count >= 10) {
      return NextResponse.json(
        { error: 'Maximum of 10 API keys allowed per organization' },
        { status: 400 }
      );
    }

    const newKey = generateApiKey(type === 'IOT' ? 'mnc_iot' : 'mnc');

    const integration = await db.integration.create({
      data: {
        type: 'ZAPIER',
        name: name.trim(),
        status: 'CONNECTED',
        apiKey: newKey,
        organizationId: session.user.organizationId,
        config: {
          keyType: type || 'GENERAL',
          createdAt: new Date().toISOString(),
          usageCount: 0,
          lastUsed: null,
        },
      },
    });

    return NextResponse.json({
      id: integration.id,
      name: integration.name,
      apiKey: newKey,
      status: integration.status,
      createdAt: integration.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('POST api-keys error:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}

// PATCH — rotate (regenerate) an existing key
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, name } = body;

    // Verify ownership — only allow operations on own org's keys, not platform-inherited
    const existing = await db.integration.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    if (action === 'rotate') {
      const newKey = generateApiKey('mnc');
      const updated = await db.integration.update({
        where: { id },
        data: {
          apiKey: newKey,
          updatedAt: new Date(),
          config: {
            ...(existing.config as object || {}),
            rotatedAt: new Date().toISOString(),
            usageCount: 0,
          },
        },
      });
      return NextResponse.json({ id: updated.id, apiKey: newKey, message: 'Key rotated successfully' });
    }

    if (action === 'rename' && name) {
      const updated = await db.integration.update({
        where: { id },
        data: { name: name.trim() },
      });
      return NextResponse.json({ id: updated.id, name: updated.name });
    }

    if (action === 'disable') {
      const updated = await db.integration.update({
        where: { id },
        data: { status: existing.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED' },
      });
      return NextResponse.json({ id: updated.id, status: updated.status });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH api-keys error:', error);
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
  }
}

// DELETE — revoke an API key
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    // Verify ownership before deleting — only allow deleting own org's keys
    const existing = await db.integration.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    await db.integration.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'API key revoked' });
  } catch (error) {
    console.error('DELETE api-keys error:', error);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}