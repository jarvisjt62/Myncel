import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkPlanLimit, checkPlanFeature } from '@/lib/plan-limits';
import { guardPermission } from '@/lib/permissions';
import { dispatchNotifications } from '@/lib/notifications/dispatch';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const denied = await guardPermission((session.user as any).id, 'machines.create');
    if (denied) return denied;

    const body = await req.json();
    const { name, model, manufacturer, location, category, criticality, notes, serialNumber } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Machine name is required' }, { status: 400 });
    }

    // Check plan limit for machines
    const limitCheck = await checkPlanLimit(session.user.organizationId, 'machines');
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: `Machine limit reached. Your ${limitCheck.plan} plan allows up to ${limitCheck.limit} machines. Please upgrade your plan to add more.`,
        code: 'PLAN_LIMIT_EXCEEDED',
        resource: 'machines',
        current: limitCheck.current,
        limit: limitCheck.limit,
        plan: limitCheck.plan,
      }, { status: 403 });
    }

    const machine = await db.machine.create({
      data: {
        name: name.trim(),
        model: model?.trim() || null,
        manufacturer: manufacturer?.trim() || null,
        location: location?.trim() || null,
        category: category || 'OTHER',
        criticality: criticality || 'MEDIUM',
        notes: notes?.trim() || null,
        serialNumber: serialNumber?.trim() || null,
        status: 'OPERATIONAL',
        organizationId: session.user.organizationId,
      },
    });

    // Fire-and-forget notifications (SMS/email/in-app/slack/webhooks)
    dispatchNotifications(session.user.organizationId, {
      type: 'equipment.added',
      machineName: machine.name,
      category: machine.category,
      location: machine.location || undefined,
      criticality: machine.criticality,
    }).catch(err => console.error('[machines] dispatch failed', err));

    return NextResponse.json({ success: true, machine }, { status: 201 });
  } catch (error) {
    console.error('Create machine error:', error);
    return NextResponse.json({ error: 'Failed to create machine' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = (url.searchParams.get('search') || '').trim();
    const limitParam = parseInt(url.searchParams.get('limit') || '', 10);
    const take = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : undefined;

    const searchWhere = search
      ? {
          OR: [
            { id: search },
            { serialNumber: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { model: { contains: search, mode: 'insensitive' as const } },
            { manufacturer: { contains: search, mode: 'insensitive' as const } },
            { location: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const machines = await db.machine.findMany({
      where: { organizationId: session.user.organizationId, ...searchWhere },
      orderBy: { name: 'asc' },
      ...(take ? { take } : {}),
      include: {
        _count: { select: { workOrders: true, maintenanceTasks: true } },
      },
    });

    return NextResponse.json({ machines });
  } catch (error) {
    console.error('Get machines error:', error);
    return NextResponse.json({ error: 'Failed to fetch machines' }, { status: 500 });
  }
}