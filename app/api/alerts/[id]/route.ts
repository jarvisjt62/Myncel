import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

function canManageAlertRecord(session: any, organizationId: string) {
  const user = session?.user as any;
  return user?.role === 'SUPER_ADMIN' || user?.email === 'admin@myncel.com' || user?.organizationId === organizationId;
}

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

    // Allow platform admins to manage any alert; regular users can only manage their org's alerts.
    if (!canManageAlertRecord(session, alert.organizationId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Granular permission check: resolving vs editing
    const isResolveOnly = body.isResolved !== undefined && !body.title && !body.message && !body.type && !body.severity;
    const requiredPerm = isResolveOnly ? 'alerts.resolve' : 'alerts.edit';
    const hasEditPerm = await hasPermission(session.user.id, requiredPerm);
    if (!hasEditPerm) {
      // Fallback: if user has the broader permission, allow it
      const hasFallback = await hasPermission(session.user.id, 'alerts.edit');
      if (!hasFallback) {
        return NextResponse.json({ error: `Forbidden — missing ${requiredPerm}` }, { status: 403 });
      }
    }

    const updated = await db.alert.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.message !== undefined ? { message: body.message } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.severity !== undefined ? { severity: body.severity } : {}),
        ...(body.isResolved !== undefined ? {
          isResolved: body.isResolved,
          resolvedAt: body.isResolved ? new Date() : null,
          isRead: body.isResolved ? true : undefined,
        } : {}),
        ...(body.isRead !== undefined ? { isRead: body.isRead } : {}),
      },
      include: {
        machine: { select: { id: true, name: true, status: true } },
        organization: { select: { id: true, name: true } },
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

    if (!canManageAlertRecord(session, alert.organizationId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(alert);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/alerts/[id] - delete an alert
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alert = await db.alert.findUnique({ where: { id: params.id } });
    if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });

    if (!canManageAlertRecord(session, alert.organizationId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!(await hasPermission(session.user.id, 'alerts.delete'))) {
      return NextResponse.json({ error: 'Forbidden — missing alerts.delete' }, { status: 403 });
    }

    await db.alert.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
