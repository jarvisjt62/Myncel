import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

// POST - Disconnect an integration
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

    // Check if user is admin or owner
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only admins can disconnect integrations' }, { status: 403 });
    }

    // Find and update the integration
    const integration = await safeQuery(
      db.integration.findFirst({
        where: {
          organizationId: user.organizationId,
          type: integrationId as any
        }
      }),
      null
    );

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Update status to disconnected
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

    // Optionally revoke OAuth tokens with the provider
    // This would require provider-specific implementation

    return NextResponse.json({
      success: true,
      message: `${params.id} integration disconnected successfully`
    });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}