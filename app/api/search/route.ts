import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const types = searchParams.get('types')?.split(',') || ['machines', 'work-orders', 'parts', 'maintenance'];
    const limit = parseInt(searchParams.get('limit') || '10');

    const results: Record<string, unknown[]> = {};
    const searchTerms = query.toLowerCase().split(' ').filter(Boolean);

    // Search machines
    if (types.includes('machines')) {
      const machineWhere: Prisma.MachineWhereInput = {
        organizationId,
        OR: searchTerms.map(term => ({
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { model: { contains: term, mode: 'insensitive' } },
            { manufacturer: { contains: term, mode: 'insensitive' } },
            { serialNumber: { contains: term, mode: 'insensitive' } },
            { location: { contains: term, mode: 'insensitive' } },
          ],
        })),
      };

      const machines = await db.machine.findMany({
        where: machineWhere,
        take: limit,
        select: {
          id: true,
          name: true,
          model: true,
          manufacturer: true,
          status: true,
          category: true,
          location: true,
        },
      });

      results.machines = machines.map(m => ({
        ...m,
        type: 'machine',
        title: m.name,
        subtitle: `${m.manufacturer || ''} ${m.model || ''}`.trim() || m.category,
        url: `/dashboard?tab=equipment&machine=${m.id}`,
      }));
    }

    // Search work orders
    if (types.includes('work-orders')) {
      const woWhere: Prisma.WorkOrderWhereInput = {
        organizationId,
        OR: searchTerms.map(term => ({
          OR: [
            { woNumber: { contains: term, mode: 'insensitive' } },
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        })),
      };

      const workOrders = await db.workOrder.findMany({
        where: woWhere,
        take: limit,
        select: {
          id: true,
          woNumber: true,
          title: true,
          status: true,
          priority: true,
          type: true,
          machine: { select: { name: true } },
        },
      });

      results.workOrders = workOrders.map(wo => ({
        ...wo,
        type: 'work-order',
        title: `${wo.woNumber}: ${wo.title}`,
        subtitle: wo.machine?.name || 'No machine',
        url: `/dashboard?tab=workorders&wo=${wo.id}`,
      }));
    }

    // Search parts
    if (types.includes('parts')) {
      const partsWhere: Prisma.PartWhereInput = {
        organizationId,
        OR: searchTerms.map(term => ({
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { partNumber: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { supplier: { contains: term, mode: 'insensitive' } },
          ],
        })),
      };

      const parts = await db.part.findMany({
        where: partsWhere,
        take: limit,
        select: {
          id: true,
          name: true,
          partNumber: true,
          quantity: true,
          minQuantity: true,
        },
      });

      results.parts = parts.map(p => ({
        ...p,
        type: 'part',
        title: p.name,
        subtitle: p.partNumber || `Qty: ${p.quantity}`,
        lowStock: p.quantity <= p.minQuantity,
        url: `/dashboard?tab=inventory&part=${p.id}`,
      }));
    }

    // Search maintenance tasks
    if (types.includes('maintenance')) {
      const tasksWhere: Prisma.MaintenanceTaskWhereInput = {
        organizationId,
        OR: searchTerms.map(term => ({
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        })),
      };

      const tasks = await db.maintenanceTask.findMany({
        where: tasksWhere,
        take: limit,
        select: {
          id: true,
          title: true,
          taskType: true,
          frequency: true,
          nextDueAt: true,
          machine: { select: { name: true } },
        },
      });

      results.maintenanceTasks = tasks.map(t => ({
        ...t,
        type: 'maintenance-task',
        title: t.title,
        subtitle: `${t.machine.name} • ${t.frequency}`,
        url: `/dashboard?tab=maintenance&task=${t.id}`,
      }));
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    return NextResponse.json({
      query,
      totalResults,
      results,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}