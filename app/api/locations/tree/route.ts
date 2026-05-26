/**
 * GET  /api/locations/tree
 *   Returns the full hierarchy for the current org as a nested tree:
 *   { sites: [{ id, name, code, buildings: [{ id, name, floors: [{ id, name, rooms: [...] }] }] }] }
 *
 * This is the single endpoint the location editor and equipment-form
 * pickers hit on page load. Cheap because there are typically < 1000 nodes
 * total per org.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await safeQuery(
    () =>
      db.user.findUnique({
        where: { id: (session.user as any).id },
        select: { organizationId: true },
      }),
    null,
  );
  if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const sites = await safeQuery(
    () =>
      db.site.findMany({
        where: { organizationId: user.organizationId! },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          timezone: true,
          buildings: {
            orderBy: { name: 'asc' },
            select: {
              id: true,
              name: true,
              code: true,
              floors: {
                orderBy: [{ level: 'asc' }, { name: 'asc' }],
                select: {
                  id: true,
                  name: true,
                  level: true,
                  rooms: {
                    orderBy: { name: 'asc' },
                    select: { id: true, name: true, code: true },
                  },
                },
              },
            },
          },
        },
      }),
    [],
  );

  // Counts of machines per node so the editor can warn before delete.
  const machines = await safeQuery(
    () =>
      db.machine.findMany({
        where: { organizationId: user.organizationId! },
        select: { siteId: true, buildingId: true, floorId: true, roomId: true },
      }),
    [],
  );

  const counts = {
    site: new Map<string, number>(),
    building: new Map<string, number>(),
    floor: new Map<string, number>(),
    room: new Map<string, number>(),
  };
  for (const m of machines || []) {
    if (m.siteId) counts.site.set(m.siteId, (counts.site.get(m.siteId) || 0) + 1);
    if (m.buildingId) counts.building.set(m.buildingId, (counts.building.get(m.buildingId) || 0) + 1);
    if (m.floorId) counts.floor.set(m.floorId, (counts.floor.get(m.floorId) || 0) + 1);
    if (m.roomId) counts.room.set(m.roomId, (counts.room.get(m.roomId) || 0) + 1);
  }

  return NextResponse.json({
    sites,
    counts: {
      site: Object.fromEntries(counts.site),
      building: Object.fromEntries(counts.building),
      floor: Object.fromEntries(counts.floor),
      room: Object.fromEntries(counts.room),
    },
  });
}
