import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

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
    const type = searchParams.get('type') || 'work-orders'; // work-orders, machines, maintenance-tasks, parts, audit-logs
    const format = searchParams.get('format') || 'csv'; // csv, json
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let data: Record<string, unknown>[] = [];
    let filename = 'export';
    let csvHeaders: string[] = [];

    switch (type) {
      case 'work-orders': {
        const where: Record<string, unknown> = { organizationId };
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
          if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
        }

        const workOrders = await db.workOrder.findMany({
          where,
          include: {
            machine: { select: { name: true } },
            assignedTo: { select: { name: true } },
            createdBy: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        data = workOrders.map(wo => ({
          woNumber: wo.woNumber,
          title: wo.title,
          type: wo.type,
          status: wo.status,
          priority: wo.priority,
          machine: wo.machine?.name || '',
          assignedTo: wo.assignedTo?.name || '',
          createdBy: wo.createdBy?.name || '',
          scheduledAt: wo.scheduledAt?.toISOString() || '',
          completedAt: wo.completedAt?.toISOString() || '',
          dueAt: wo.dueAt?.toISOString() || '',
          estimatedMinutes: wo.estimatedMinutes || '',
          actualMinutes: wo.actualMinutes || '',
          laborCost: wo.laborCost || '',
          partsCost: wo.partsCost || '',
          totalCost: wo.totalCost || '',
          createdAt: wo.createdAt.toISOString(),
        }));

        filename = 'work-orders';
        csvHeaders = [
          'WO Number', 'Title', 'Type', 'Status', 'Priority', 'Machine',
          'Assigned To', 'Created By', 'Scheduled At', 'Completed At', 'Due At',
          'Est. Minutes', 'Actual Minutes', 'Labor Cost', 'Parts Cost', 'Total Cost', 'Created At'
        ];
        break;
      }

      case 'machines': {
        const machines = await db.machine.findMany({
          where: { organizationId },
          orderBy: { name: 'asc' },
        });

        data = machines.map(m => ({
          name: m.name,
          model: m.model || '',
          manufacturer: m.manufacturer || '',
          serialNumber: m.serialNumber || '',
          location: m.location || '',
          category: m.category,
          status: m.status,
          criticality: m.criticality,
          totalHours: m.totalHours,
          lastServiceAt: m.lastServiceAt?.toISOString() || '',
          yearInstalled: m.yearInstalled || '',
          createdAt: m.createdAt.toISOString(),
        }));

        filename = 'machines';
        csvHeaders = [
          'Name', 'Model', 'Manufacturer', 'Serial Number', 'Location',
          'Category', 'Status', 'Criticality', 'Total Hours', 'Last Service',
          'Year Installed', 'Created At'
        ];
        break;
      }

      case 'maintenance-tasks': {
        const tasks = await db.maintenanceTask.findMany({
          where: { organizationId },
          include: {
            machine: { select: { name: true } },
          },
          orderBy: { nextDueAt: 'asc' },
        });

        data = tasks.map(t => ({
          title: t.title,
          machine: t.machine.name,
          taskType: t.taskType,
          frequency: t.frequency,
          priority: t.priority,
          isActive: t.isActive,
          nextDueAt: t.nextDueAt?.toISOString() || '',
          lastCompletedAt: t.lastCompletedAt?.toISOString() || '',
          estimatedMinutes: t.estimatedMinutes || '',
        }));

        filename = 'maintenance-tasks';
        csvHeaders = [
          'Title', 'Machine', 'Type', 'Frequency', 'Priority', 'Active',
          'Next Due', 'Last Completed', 'Est. Minutes'
        ];
        break;
      }

      case 'parts': {
        const parts = await db.part.findMany({
          where: { organizationId },
          orderBy: { name: 'asc' },
        });

        data = parts.map(p => ({
          name: p.name,
          partNumber: p.partNumber || '',
          description: p.description || '',
          quantity: p.quantity,
          minQuantity: p.minQuantity,
          unitCost: p.unitCost || '',
          supplier: p.supplier || '',
          location: p.location || '',
          needsReorder: p.quantity <= p.minQuantity ? 'Yes' : 'No',
        }));

        filename = 'parts-inventory';
        csvHeaders = [
          'Name', 'Part Number', 'Description', 'Quantity', 'Min Quantity',
          'Unit Cost', 'Supplier', 'Location', 'Needs Reorder'
        ];
        break;
      }

      case 'audit-logs': {
        const user = await db.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });

        if (!user || !['OWNER', 'ADMIN'].includes(user.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        const where: Record<string, unknown> = { organizationId };
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
          if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
        }

        const logs = await db.auditLog.findMany({
          where,
          include: {
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        });

        data = logs.map(l => ({
          action: l.action,
          entity: l.entity,
          entityId: l.entityId || '',
          user: l.user?.name || '',
          email: l.user?.email || '',
          ipAddress: l.ipAddress || '',
          createdAt: l.createdAt.toISOString(),
        }));

        filename = 'audit-logs';
        csvHeaders = [
          'Action', 'Entity', 'Entity ID', 'User', 'Email', 'IP Address', 'Created At'
        ];
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 }
        );
    }

    // Log the export
    await logAudit({
      action: 'EXPORT',
      entity: type,
      userId: session.user.id,
      organizationId,
      changes: { after: { format, recordCount: data.length } },
    });

    if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }

    // Generate CSV
    const csvContent = generateCSV(data, csvHeaders);

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

function generateCSV(data: Record<string, unknown>[], headers: string[]): string {
  if (data.length === 0) {
    return headers.join(',') + '\n';
  }

  const keys = Object.keys(data[0]);
  
  // Escape CSV value
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Header row
  const headerRow = headers.map(escapeCSV).join(',');
  
  // Data rows
  const dataRows = data.map(row => 
    keys.map(key => escapeCSV(row[key])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}