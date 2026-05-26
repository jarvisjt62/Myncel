import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkPlanLimit, checkPlanFeature } from '@/lib/plan-limits';
import { guardPermission } from '@/lib/permissions';
import { dispatchNotifications } from '@/lib/notifications/dispatch';

export const dynamic = 'force-dynamic';

/**
 * Validates that supplied site/building/floor/room IDs belong to the org and
 * form a consistent chain (e.g. roomId's floor must equal floorId).
 *
 * Returns either { siteId, buildingId, floorId, roomId } (each null if not provided)
 * or { error } if the chain is invalid.
 */
async function validateLocationIds(input: {
  organizationId: string;
  siteId?: string | null;
  buildingId?: string | null;
  floorId?: string | null;
  roomId?: string | null;
}): Promise<
  | { siteId: string | null; buildingId: string | null; floorId: string | null; roomId: string | null }
  | { error: string }
> {
  const norm = (v: any) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  let siteId = norm(input.siteId);
  let buildingId = norm(input.buildingId);
  let floorId = norm(input.floorId);
  let roomId = norm(input.roomId);

  // If a deeper level is set, fill missing parents from it.
  if (roomId) {
    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room || room.organizationId !== input.organizationId) return { error: 'Room not found in this organization' };
    floorId = floorId ?? room.floorId;
    buildingId = buildingId ?? room.buildingId;
    siteId = siteId ?? room.siteId;
    if (room.floorId !== floorId) return { error: 'Room does not belong to the selected floor' };
  }
  if (floorId) {
    const floor = await db.floor.findUnique({ where: { id: floorId } });
    if (!floor || floor.organizationId !== input.organizationId) return { error: 'Floor not found in this organization' };
    buildingId = buildingId ?? floor.buildingId;
    siteId = siteId ?? floor.siteId;
    if (floor.buildingId !== buildingId) return { error: 'Floor does not belong to the selected building' };
  }
  if (buildingId) {
    const bld = await db.building.findUnique({ where: { id: buildingId } });
    if (!bld || bld.organizationId !== input.organizationId) return { error: 'Building not found in this organization' };
    siteId = siteId ?? bld.siteId;
    if (bld.siteId !== siteId) return { error: 'Building does not belong to the selected site' };
  }
  if (siteId) {
    const site = await db.site.findUnique({ where: { id: siteId } });
    if (!site || site.organizationId !== input.organizationId) return { error: 'Site not found in this organization' };
  }

  return { siteId, buildingId, floorId, roomId };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const denied = await guardPermission((session.user as any).id, 'machines.create');
    if (denied) return denied;

    const body = await req.json();
    const {
      name, model, manufacturer, location, category, criticality, notes, serialNumber,
      siteId, buildingId, floorId, roomId,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Machine name is required' }, { status: 400 });
    }

    // Validate the location-hierarchy IDs (each one must belong to the org and
    // be consistent with its parent). Empty / undefined IDs are skipped.
    const locIds = await validateLocationIds({
      organizationId: session.user.organizationId,
      siteId, buildingId, floorId, roomId,
    });
    if ('error' in locIds) {
      return NextResponse.json({ error: locIds.error }, { status: 400 });
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
        siteId: locIds.siteId,
        buildingId: locIds.buildingId,
        floorId: locIds.floorId,
        roomId: locIds.roomId,
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

    // Optional hierarchy filters: ?siteId / ?buildingId / ?floorId / ?roomId
    const filterSite = url.searchParams.get('siteId') || undefined;
    const filterBuilding = url.searchParams.get('buildingId') || undefined;
    const filterFloor = url.searchParams.get('floorId') || undefined;
    const filterRoom = url.searchParams.get('roomId') || undefined;

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
      where: {
        organizationId: session.user.organizationId,
        ...searchWhere,
        ...(filterSite ? { siteId: filterSite } : {}),
        ...(filterBuilding ? { buildingId: filterBuilding } : {}),
        ...(filterFloor ? { floorId: filterFloor } : {}),
        ...(filterRoom ? { roomId: filterRoom } : {}),
      },
      orderBy: { name: 'asc' },
      ...(take ? { take } : {}),
      include: {
        _count: { select: { workOrders: true, maintenanceTasks: true } },
        site: { select: { id: true, name: true } },
        building: { select: { id: true, name: true } },
        floor: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ machines });
  } catch (error) {
    console.error('Get machines error:', error);
    return NextResponse.json({ error: 'Failed to fetch machines' }, { status: 500 });
  }
}