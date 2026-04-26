import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/alerts/[id] - resolve or update an alert
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const alert = await db.alert.findUnique({ where: { id: params.id } });

    if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });

    // Allow SUPER_ADMIN to resolve any alert; regular users can only resolve their org's alerts
    const isSuperAdmin = (session.user as any).role === 'SUPER_ADMIN';
    if (!isSuperAdmin && alert.organizationId !== (session.user as any).organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await db.alert.update({
      where: { id: params.id },
      data: {
        ...(body.isResolved !== undefined ? {
          isResolved: body.isResolved,
          resolvedAt: body.isResolved ? new Date() : null,
          isRead: body.isResolved ? true : undefined,
        } : {}),
        ...(body.isRead !== undefined ? { isRead: body.isRead } : {}),
      },
    });

    return NextResponse.json({ success: true, alert: updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// GET /api/alerts/[id] - get alert details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alert = await db.alert.findUnique({
      where: { id: params.id },
      include: {
        machine: { select: { id: true, name: true, status: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });

    const isSuperAdmin = (session.user as any).role === 'SUPER_ADMIN';
    if (!isSuperAdmin && alert.organizationId !== (session.user as any).organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(alert);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}