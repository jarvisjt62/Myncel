import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

// Platform-wide integration types that are managed at the admin level
const PLATFORM_WIDE_TYPES = new Set(['TWILIO', 'ZAPIER', 'SLACK', 'WEBHOOKS', 'QUICKBOOKS', 'GOOGLE_SHEETS']);

// POST - Disconnect an integration (or disable platform-inherited integration for this org)
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
    const isPlatformWide = PLATFORM_WIDE_TYPES.has(integrationId);

    // Get user's organization and admin org in parallel
    const [user, adminOrgId] = await Promise.all([
      safeQuery(
        db.user.findUnique({
          where: { email: session.user.email || '' },
          select: { organizationId: true, role: true }
        }),
        null
      ),
      // Get admin org ID to check if this is a non-admin org
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
      return NextResponse.json({ error: 'Only org admins can disconnect integrations' }, { status: 403 });
    }

    const isSameOrgAsAdmin = user.organizationId === adminOrgId?.organizationId;

    // For platform-wide types in non-admin orgs, the "disconnect" action means
    // opting out of the platform default — not actually removing the integration.
    // This is consistent with how SMS notifications work.
    if (isPlatformWide && !isSameOrgAsAdmin) {
      // Find existing record for this org
      const integration = await safeQuery(
        db.integration.findFirst({
          where: {
            organizationId: user.organizationId,
            type: integrationId as any
          }
        }),
        null
      );

      if (integration) {
        // Update existing record to DISCONNECTED with platform opt-out flag
        const existingConfig = (integration.config as Record<string, any>) || {};
        await safeQuery(
          db.integration.update({
            where: { id: integration.id },
            data: {
              status: 'DISCONNECTED',
              disconnectedAt: new Date(),
              accessToken: null,
              refreshToken: null,
              config: {
                ...existingConfig,
                disabledPlatformInheritance: true,
                disabledAt: new Date().toISOString(),
              },
            }
          }),
          null
        );
      } else {
        // No existing record — create a DISCONNECTED record to opt out
        await safeQuery(
          db.integration.create({
            data: {
              type: integrationId as any,
              name: integrationId.charAt(0).toUpperCase() + integrationId.slice(1).toLowerCase(),
              status: 'DISCONNECTED',
              organizationId: user.organizationId,
              config: {
                disabledPlatformInheritance: true,
                disabledAt: new Date().toISOString(),
              },
            }
          }),
          null
        );
      }
    } else {
      // Admin org or non-platform-wide type — actual disconnect
      const integration = await safeQuery(
        db.integration.findFirst({
          where: {
            organizationId: user.organizationId,
            type: integrationId as any
          }
        }),
        null
      );

      if (integration) {
        await safeQuery(
          db.integration.update({
            where: { id: integration.id },
            data: {
              status: 'DISCONNECTED',
              disconnectedAt: new Date(),
              accessToken: null,
              refreshToken: null
            }
          }),
          null
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `${params.id} integration disconnected successfully`
    });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}