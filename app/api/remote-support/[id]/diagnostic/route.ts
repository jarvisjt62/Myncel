import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role as string;
    const email = session.user.email as string;
    const orgId = (session.user as any).organizationId as string | undefined;
    const isAdmin = role === 'SUPER_ADMIN' || (role === 'ADMIN' && !orgId) || email === 'admin@myncel.com';
    const supportSession = await db.remoteSupportSession.findUnique({ where: { id: params.id }, include: { machine: true } });
    if (!supportSession) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!isAdmin && orgId !== supportSession.organizationId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const snapshot: any = { capturedAt: new Date().toISOString(), sessionId: params.id, machine: null, recentAlerts: [], openWorkOrders: [], recentMaintenanceTasks: [], latestSensorReading: null };
    if (supportSession.machineId) {
      const machine = await db.machine.findUnique({ where: { id: supportSession.machineId }, select: { id: true, name: true, model: true, manufacturer: true, status: true, criticality: true, location: true, totalHours: true, lastServiceAt: true, category: true, imageUrl: true } });
      snapshot.machine = machine;
      const alerts = await db.alert.findMany({ where: { machineId: supportSession.machineId }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, type: true, message: true, severity: true, isResolved: true, createdAt: true } });
      snapshot.recentAlerts = alerts.map((a: any) => ({ ...a, status: a.isResolved ? 'RESOLVED' : 'OPEN' }));
      const workOrders = await db.workOrder.findMany({ where: { machineId: supportSession.machineId, status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] } }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, woNumber: true, title: true, status: true, priority: true, dueAt: true } });
      snapshot.openWorkOrders = workOrders;
      const tasks = await db.maintenanceTask.findMany({ where: { machineId: supportSession.machineId }, orderBy: { nextDueAt: 'asc' }, take: 5, select: { id: true, title: true, taskType: true, frequency: true, nextDueAt: true, isActive: true, lastCompletedAt: true } });
      snapshot.recentMaintenanceTasks = tasks;
      const sr = await db.sensorReading.findFirst({ where: { machineId: supportSession.machineId }, orderBy: { recordedAt: 'desc' }, select: { type: true, value: true, unit: true, recordedAt: true } });
      snapshot.latestSensorReading = sr ? { sensorType: sr.type, value: sr.value, unit: sr.unit, timestamp: sr.recordedAt } : null;
    }
    await db.remoteSupportSession.update({ where: { id: params.id }, data: { diagnosticSnapshot: snapshot } });
    await db.supportAuditLog.create({ data: { sessionId: params.id, actorName: session.user.name || session.user.email || 'Admin', action: 'SNAPSHOT_TAKEN', detail: `Diagnostic snapshot captured at ${snapshot.capturedAt}` } });
    return NextResponse.json({ snapshot });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
