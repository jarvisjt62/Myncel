/**
 * POST /api/ai/detect            — manually run engine across the org
 * POST /api/ai/detect/[machineId] — run engine on a single machine
 *
 * Triggered from the UI (Run Now button) or from a cron job. Returns
 * a summary of detections + forecasts produced.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { runEngineForMachine } from '@/lib/ai/store';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await safeQuery(
    () =>
      db.user.findUnique({
        where: { id: (session.user as any).id },
        select: { organizationId: true, role: true },
      }),
    null,
  );
  if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  if (user.role !== 'OWNER' && user.role !== 'ADMIN' && user.role !== 'TECHNICIAN') {
    return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
  }

  const machines = await safeQuery(
    () => db.machine.findMany({ where: { organizationId: user.organizationId! } }),
    [] as any[],
  );

  let totalDetections = 0;
  let totalForecasts = 0;
  let skippedDisabled = 0;

  for (const m of machines) {
    const result = await runEngineForMachine(m as any);
    if (result.skipped) {
      if (result.reason === 'disabled') skippedDisabled++;
      continue;
    }
    totalDetections += result.detections.length;
    totalForecasts += result.forecasts.length;
  }

  return NextResponse.json({
    machinesScanned: machines.length,
    skippedDisabled,
    detectionsCreated: totalDetections,
    forecastsCreated: totalForecasts,
  });
}
