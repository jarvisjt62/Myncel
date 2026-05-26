/**
 * lib/reports/datasets.ts
 *
 * Dataset definitions for Saved Reports. Each dataset describes:
 *   - The display name shown in the create-report UI.
 *   - Allowed filter fields and their types.
 *   - The Prisma query that materialises rows for a given org + filters.
 *   - The CSV columns emitted.
 *
 * To add a new dataset:
 *   1. Add a new value to the `ReportDataset` enum in prisma/schema.prisma
 *   2. Add a new key to `DATASETS` below
 *   3. The UI will pick it up automatically via /api/reports/datasets.
 */

import { db, safeQuery } from '@/lib/db';

export type ReportDataset =
  | 'WORK_ORDERS'
  | 'ALERTS'
  | 'MACHINES'
  | 'PARTS'
  | 'DOWNTIME'
  | 'PM_COMPLIANCE';

export interface DatasetFilters {
  /** ISO date — only include rows >= this date (createdAt or relevant timestamp). */
  from?: string;
  /** ISO date — only include rows < this date. */
  to?: string;
  /** Free-text — applied with case-insensitive contains on the primary text column. */
  search?: string;
  /** Status filter — semantics vary per dataset. */
  status?: string[];
  /** Priority filter — work orders only. */
  priority?: string[];
  /** Machine ID filter — work orders / alerts / downtime. */
  machineId?: string[];
}

export interface DatasetRow {
  [column: string]: string | number | boolean | null;
}

export interface DatasetDefinition {
  id: ReportDataset;
  label: string;
  description: string;
  /** Whether this dataset supports a date range filter. */
  supportsDateRange: boolean;
  /** Available filter keys for the UI. */
  filters: Array<'from' | 'to' | 'search' | 'status' | 'priority' | 'machineId'>;
  /** CSV column order. */
  columns: string[];
  /** Run the query and return CSV-ready rows. */
  run: (organizationId: string, filters: DatasetFilters) => Promise<DatasetRow[]>;
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function dateClause(from?: string, to?: string): { gte?: Date; lt?: Date } | undefined {
  const out: { gte?: Date; lt?: Date } = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) out.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) out.lt = d;
  }
  return Object.keys(out).length ? out : undefined;
}

function fmtDate(d: Date | null | undefined): string {
  return d ? new Date(d).toISOString() : '';
}

/* ── WORK_ORDERS ─────────────────────────────────────────────────── */

const workOrders: DatasetDefinition = {
  id: 'WORK_ORDERS',
  label: 'Work Orders',
  description: 'All work orders with title, machine, status, priority, assignee, and cost breakdown.',
  supportsDateRange: true,
  filters: ['from', 'to', 'search', 'status', 'priority', 'machineId'],
  columns: [
    'WO Number', 'Title', 'Machine', 'Type', 'Status', 'Priority',
    'Assigned To', 'Created At', 'Completed At',
    'Estimated Min', 'Actual Min',
    'Labor Cost', 'Parts Cost', 'Total Cost', 'Currency',
  ],
  async run(organizationId, filters) {
    const where: any = { organizationId };
    const date = dateClause(filters.from, filters.to);
    if (date) where.createdAt = date;
    if (filters.search) where.title = { contains: filters.search, mode: 'insensitive' };
    if (filters.status?.length) where.status = { in: filters.status };
    if (filters.priority?.length) where.priority = { in: filters.priority };
    if (filters.machineId?.length) where.machineId = { in: filters.machineId };

    const rows = await safeQuery(
      db.workOrder.findMany({
        where,
        include: {
          machine: { select: { name: true } },
          assignedTo: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10000, // cap any single export at 10k rows
      }),
      []
    );

    return (rows as any[]).map((r) => ({
      'WO Number': r.woNumber || '',
      'Title': r.title || '',
      'Machine': r.machine?.name || '',
      'Type': r.type || '',
      'Status': r.status || '',
      'Priority': r.priority || '',
      'Assigned To': r.assignedTo?.name || r.assignedTo?.email || '',
      'Created At': fmtDate(r.createdAt),
      'Completed At': fmtDate(r.completedAt),
      'Estimated Min': r.estimatedMinutes ?? '',
      'Actual Min': r.actualMinutes ?? '',
      'Labor Cost': r.laborCost ?? '',
      'Parts Cost': r.partsCost ?? '',
      'Total Cost': r.totalCost ?? '',
      'Currency': r.currency || '',
    }));
  },
};

/* ── ALERTS ──────────────────────────────────────────────────────── */

const alerts: DatasetDefinition = {
  id: 'ALERTS',
  label: 'Alerts',
  description: 'IoT and rule-based alerts triggered against machines.',
  supportsDateRange: true,
  filters: ['from', 'to', 'search', 'status', 'machineId'],
  columns: ['Alert', 'Machine', 'Severity', 'Status', 'Triggered At', 'Resolved At', 'Message'],
  async run(organizationId, filters) {
    const where: any = { organizationId };
    const date = dateClause(filters.from, filters.to);
    if (date) where.createdAt = date;
    if (filters.search) where.message = { contains: filters.search, mode: 'insensitive' };
    if (filters.status?.length) {
      // status filter understands "OPEN" / "RESOLVED"
      const wantOpen = filters.status.includes('OPEN');
      const wantResolved = filters.status.includes('RESOLVED');
      if (wantOpen && !wantResolved) where.isResolved = false;
      else if (wantResolved && !wantOpen) where.isResolved = true;
    }
    if (filters.machineId?.length) where.machineId = { in: filters.machineId };

    const rows = await safeQuery(
      db.alert.findMany({
        where,
        include: { machine: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10000,
      }),
      []
    );

    return (rows as any[]).map((r) => ({
      'Alert': r.title || r.type || '',
      'Machine': r.machine?.name || '',
      'Severity': r.severity || '',
      'Status': r.isResolved ? 'RESOLVED' : 'OPEN',
      'Triggered At': fmtDate(r.createdAt),
      'Resolved At': fmtDate(r.resolvedAt),
      'Message': r.message || '',
    }));
  },
};

/* ── MACHINES ────────────────────────────────────────────────────── */

const machines: DatasetDefinition = {
  id: 'MACHINES',
  label: 'Machines',
  description: 'Equipment inventory with status, criticality, and location.',
  supportsDateRange: false,
  filters: ['search', 'status'],
  columns: ['Name', 'Category', 'Status', 'Criticality', 'Location', 'Manufacturer', 'Model', 'Serial', 'Year Installed', 'Total Hours'],
  async run(organizationId, filters) {
    const where: any = { organizationId };
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };
    if (filters.status?.length) where.status = { in: filters.status };

    const rows = await safeQuery(
      db.machine.findMany({
        where,
        orderBy: { name: 'asc' },
        take: 10000,
      }),
      []
    );

    return (rows as any[]).map((r) => ({
      'Name': r.name || '',
      'Category': r.category || '',
      'Status': r.status || '',
      'Criticality': r.criticality || '',
      'Location': r.location || '',
      'Manufacturer': r.manufacturer || '',
      'Model': r.model || '',
      'Serial': r.serialNumber || '',
      'Year Installed': r.yearInstalled ?? '',
      'Total Hours': r.totalHours ?? 0,
    }));
  },
};

/* ── PARTS ───────────────────────────────────────────────────────── */

const parts: DatasetDefinition = {
  id: 'PARTS',
  label: 'Parts Inventory',
  description: 'Parts catalog with current stock, reorder point, and unit cost.',
  supportsDateRange: false,
  filters: ['search'],
  columns: ['Name', 'Part Number', 'Quantity', 'Min Quantity', 'Unit Cost', 'Currency', 'Location', 'Supplier'],
  async run(organizationId, filters) {
    const where: any = { organizationId };
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };

    const rows = await safeQuery(
      db.part.findMany({
        where,
        orderBy: { name: 'asc' },
        take: 10000,
      }),
      []
    );

    return (rows as any[]).map((r) => ({
      'Name': r.name || '',
      'Part Number': r.partNumber || '',
      'Quantity': r.quantity ?? 0,
      'Min Quantity': r.minQuantity ?? '',
      'Unit Cost': r.unitCost ?? '',
      'Currency': r.currency || '',
      'Location': r.location || '',
      'Supplier': r.supplier || '',
    }));
  },
};

/* ── DOWNTIME ────────────────────────────────────────────────────── */

const downtime: DatasetDefinition = {
  id: 'DOWNTIME',
  label: 'Downtime',
  description: 'Periods when machines were not running, derived from completed corrective / emergency work orders.',
  supportsDateRange: true,
  filters: ['from', 'to', 'machineId'],
  columns: ['Machine', 'WO Number', 'Started', 'Ended', 'Duration (hours)', 'Reason', 'Cost'],
  async run(organizationId, filters) {
    const where: any = { organizationId, status: 'COMPLETED', type: { in: ['CORRECTIVE', 'EMERGENCY'] } };
    const date = dateClause(filters.from, filters.to);
    if (date) where.createdAt = date;
    if (filters.machineId?.length) where.machineId = { in: filters.machineId };

    const rows = await safeQuery(
      db.workOrder.findMany({
        where,
        include: { machine: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10000,
      }),
      []
    );

    return (rows as any[]).map((r) => {
      const started = r.startedAt || r.createdAt;
      const ended = r.completedAt;
      const hours = (started && ended)
        ? Math.round(((new Date(ended).getTime() - new Date(started).getTime()) / 3_600_000) * 10) / 10
        : '';
      return {
        'Machine': r.machine?.name || '',
        'WO Number': r.woNumber || '',
        'Started': fmtDate(started),
        'Ended': fmtDate(ended),
        'Duration (hours)': hours,
        'Reason': r.title || '',
        'Cost': r.totalCost ?? '',
      };
    });
  },
};

/* ── PM_COMPLIANCE ───────────────────────────────────────────────── */

const pmCompliance: DatasetDefinition = {
  id: 'PM_COMPLIANCE',
  label: 'PM Compliance',
  description: 'Preventive-maintenance schedules with last/next due dates and on-time vs late status.',
  supportsDateRange: false,
  filters: ['machineId', 'status'],
  columns: ['Task', 'Machine', 'Frequency', 'Last Completed', 'Next Due', 'Status', 'Days Until Due'],
  async run(organizationId, filters) {
    const where: any = { organizationId };
    if (filters.machineId?.length) where.machineId = { in: filters.machineId };

    const rows = await safeQuery(
      db.maintenanceTask.findMany({
        where,
        include: { machine: { select: { name: true } } },
        orderBy: { nextDueAt: 'asc' },
        take: 10000,
      }),
      []
    );

    const now = Date.now();
    const result = (rows as any[]).map((r) => {
      const nextDue = r.nextDueAt ? new Date(r.nextDueAt).getTime() : null;
      const daysUntil = nextDue ? Math.round((nextDue - now) / 86_400_000) : '';
      let status = '';
      if (nextDue) {
        if (nextDue < now) status = 'OVERDUE';
        else if ((nextDue - now) < 7 * 86_400_000) status = 'DUE_SOON';
        else status = 'ON_SCHEDULE';
      }
      let freq = r.frequency || '';
      if (r.intervalDays) freq = `Every ${r.intervalDays} day(s)`;
      else if (r.intervalHours) freq = `Every ${r.intervalHours} hour(s)`;
      return {
        'Task': r.title || '',
        'Machine': r.machine?.name || '',
        'Frequency': freq,
        'Last Completed': fmtDate(r.lastCompletedAt),
        'Next Due': fmtDate(r.nextDueAt),
        'Status': status,
        'Days Until Due': daysUntil,
      };
    });

    // Apply status filter post-hoc since it's computed
    if (filters.status?.length) {
      const wanted = new Set(filters.status);
      return result.filter((r) => wanted.has(String(r['Status'])));
    }
    return result;
  },
};

/* ── Registry ────────────────────────────────────────────────────── */

export const DATASETS: Record<ReportDataset, DatasetDefinition> = {
  WORK_ORDERS:   workOrders,
  ALERTS:        alerts,
  MACHINES:      machines,
  PARTS:         parts,
  DOWNTIME:      downtime,
  PM_COMPLIANCE: pmCompliance,
};

/* ── CSV serialiser ──────────────────────────────────────────────── */

export function rowsToCsv(columns: string[], rows: DatasetRow[]): string {
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map(escape).join(',');
  const body = rows.map((r) => columns.map((c) => escape(r[c])).join(',')).join('\n');
  return body ? `${header}\n${body}\n` : `${header}\n`;
}
