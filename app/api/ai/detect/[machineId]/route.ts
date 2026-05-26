/**
 * POST /api/ai/detect/[machineId]  — run anomaly + forecast engine for one machine
 * GET  /api/ai/detect/[machineId]  — list recent detections + forecasts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { runEngineForMachine } from '@/lib/ai/store';

export const dynamic = 'force-dynamic';

async function requireMachine(machineId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const user = await safeQuery(
    () =>
      db.user.findUnique({
        where: { id: (session.user as any).id },
        select: { organizationId: true, role: true },
      }),
    null,
  );
  if (!user?.organizationId) return { error: NextResponse.json({ error: 'No organization' }, { status: 400 }) };
  const machine = await safeQuery(
    () =>
      db.machine.findFirst({
        where: { id: machineId, organizationId: user.organizationId! },
      }),
    null,
  );
  if (!machine) return { error: NextResponse.json({ error: 'Machine not found' }, { status: 404 }) };
  return { user, machine };
}

export async function GET(_req: NextRequest, { params }: { params: { machineId: string } }) {
  const r = await requireMachine(params.machineId);
  if ('error' in r) return r.error;

  const [detections, forecasts] = await Promise.all([
    safeQuery(
      () =>
        db.anomalyDetection.findMany({
          where: { machineId: params.machineId },
          orderBy: { detectedAt: 'desc' },
          take: 50,
          include: { alert: { select: { id: true, severity: true, isResolved: true } } },
        }),
      [] as any[],
    ),
    safeQuery(
      () =>
        db.predictiveForecast.findMany({
          where: { machineId: params.machineId, validUntil: { gte: new Date() } },
          orderBy: { generatedAt: 'desc' },
        }),
      [] as any[],
    ),
  ]);

  return NextResponse.json({ detections, forecasts });
}

export async function POST(_req: NextRequest, { params }: { params: { machineId: string } }) {
  const r = await requireMachine(params.machineId);
  if ('error' in r) return r.error;
  const role = (r.user as any).role;
  if (role !== 'OWNER' && role !== 'ADMIN' && role !== 'TECHNICIAN') {
    return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
  }
  const result = await runEngineForMachine(r.machine as any);
  return NextResponse.json(result);
}
