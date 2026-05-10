import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

// POST - Re-enable a platform-inherited integration that was previously disabled by this org
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

    // Check if user is admin or owner of their org
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only org admins can re-enable integrations' }, { status: 403 });
    }

    // Find the existing DISCONNECTED record with disabledPlatformInheritance flag
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
      // This was a genuinely disconnected integration (not a platform opt-out).
      // They should use the regular connect flow instead.
      return NextResponse.json({
        error: 'This integration was disconnected, not disabled from platform default. Use the Connect button to reconnect.',
        useConnectFlow: true,
      }, { status: 400 });
    }

    // This was a platform opt-out. Delete the DISCONNECTED record so the org
    // will again inherit the platform default.
    await safeQuery(
      db.integration.delete({
        where: { id: integration.id },
      }),
      null
    );

    return NextResponse.json({
      success: true,
      message: `${params.id} integration re-enabled. It will now inherit from the platform default.`,
    });
  } catch (error) {
    console.error('Error re-enabling integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}