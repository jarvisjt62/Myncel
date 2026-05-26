import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { guardPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// GET /api/machines/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const machine = await db.machine.findUnique({
      where: { id: params.id },
      include: {
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, woNumber: true, title: true, status: true, priority: true, dueAt: true },
        },
        maintenanceTasks: {
          where: { isActive: true },
          orderBy: { nextDueAt: 'asc' },
          take: 5,
          select: { id: true, title: true, frequency: true, nextDueAt: true, lastCompletedAt: true, priority: true },
        },
        alerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { id: true, title: true, severity: true, createdAt: true },
        },
        machineDeviceTokens: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            tokenPrefix: true,
            isActive: true,
            lastSeenAt: true,
            revokedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: { select: { workOrders: true, maintenanceTasks: true, alerts: true } },
      },
    });

    if (!machine) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    if (!isSuperAdmin && machine.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(machine);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/machines/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const machine = await db.machine.findUnique({ where: { id: params.id } });
    if (!machine) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const isSA = session.user.role === 'SUPER_ADMIN';
    if (!isSA && machine.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const denied = await guardPermission(session.user.id, 'machines.edit');
    if (denied) return denied;

    // If any of the location-hierarchy fields are being touched, validate the
    // chain. We treat siteId / buildingId / floorId / roomId as a unit: if any
    // are present in the body we re-resolve the full chain, otherwise leave
    // every relation untouched.
    const touchesHierarchy = ['siteId', 'buildingId', 'floorId', 'roomId'].some((k) => k in body);

    let hierarchyData: Record<string, string | null> = {};
    if (touchesHierarchy) {
      const siteId = 'siteId' in body ? body.siteId ?? null : machine.siteId;
      const buildingId = 'buildingId' in body ? body.buildingId ?? null : machine.buildingId;
      const floorId = 'floorId' in body ? body.floorId ?? null : machine.floorId;
      const roomId = 'roomId' in body ? body.roomId ?? null : machine.roomId;

      const norm = (v: any) => (typeof v === 'string' && v.trim() ? v.trim() : null);
      let nSite = norm(siteId),
        nBld = norm(buildingId),
        nFlr = norm(floorId),
        nRm = norm(roomId);

      if (nRm) {
        const room = await db.room.findUnique({ where: { id: nRm } });
        if (!room || room.organizationId !== machine.organizationId)
          return NextResponse.json({ error: 'Room not found in this organization' }, { status: 400 });
        nFlr = nFlr ?? room.floorId;
        nBld = nBld ?? room.buildingId;
        nSite = nSite ?? room.siteId;
        if (room.floorId !== nFlr)
          return NextResponse.json({ error: 'Room does not belong to the selected floor' }, { status: 400 });
      }
      if (nFlr) {
        const floor = await db.floor.findUnique({ where: { id: nFlr } });
        if (!floor || floor.organizationId !== machine.organizationId)
          return NextResponse.json({ error: 'Floor not found in this organization' }, { status: 400 });
        nBld = nBld ?? floor.buildingId;
        nSite = nSite ?? floor.siteId;
        if (floor.buildingId !== nBld)
          return NextResponse.json({ error: 'Floor does not belong to the selected building' }, { status: 400 });
      }
      if (nBld) {
        const bld = await db.building.findUnique({ where: { id: nBld } });
        if (!bld || bld.organizationId !== machine.organizationId)
          return NextResponse.json({ error: 'Building not found in this organization' }, { status: 400 });
        nSite = nSite ?? bld.siteId;
        if (bld.siteId !== nSite)
          return NextResponse.json({ error: 'Building does not belong to the selected site' }, { status: 400 });
      }
      if (nSite) {
        const site = await db.site.findUnique({ where: { id: nSite } });
        if (!site || site.organizationId !== machine.organizationId)
          return NextResponse.json({ error: 'Site not found in this organization' }, { status: 400 });
      }

      hierarchyData = { siteId: nSite, buildingId: nBld, floorId: nFlr, roomId: nRm };
    }

    const updated = await db.machine.update({
      where: { id: params.id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(body.criticality ? { criticality: body.criticality } : {}),
        ...(body.model !== undefined ? { model: body.model } : {}),
        ...(body.manufacturer !== undefined ? { manufacturer: body.manufacturer } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
        ...(body.lastServiceAt ? { lastServiceAt: new Date(body.lastServiceAt) } : {}),
        ...hierarchyData,
      },
    });

    return NextResponse.json({ success: true, machine: updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
// DELETE /api/machines/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const machine = await db.machine.findUnique({ where: { id: params.id } });
    if (!machine) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isSA = session.user.role === 'SUPER_ADMIN';
    if (!isSA && machine.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const denied = await guardPermission(session.user.id, 'machines.delete');
    if (denied) return denied;

    // Delete cascade: alerts, work orders, maintenance tasks, then machine
    await db.alert.deleteMany({ where: { machineId: params.id } });
    await db.workOrder.deleteMany({ where: { machineId: params.id } });
    await db.maintenanceTask.deleteMany({ where: { machineId: params.id } });
    await db.machine.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
