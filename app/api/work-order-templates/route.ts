/**
 * /api/work-order-templates
 *
 * Reusable Work Order templates — org-scoped, no machine binding.
 * GET   → list (org-scoped, optional ?includeArchived=1)
 * POST  → create
 *
 * Templates are spawned into actual WorkOrder rows via
 * /api/work-order-templates/[id]/spawn (separate route).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { guardPermission } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

/** Resolve the org the calling user is acting against. Mirrors the
 *  pattern used in /api/work-orders so platform admins can manage
 *  templates on behalf of any org via ?orgId=. */
async function resolveOrgId(session: any, qOrgId: string | null): Promise<string | null> {
  const sessOrgId = (session.user as any).organizationId as string | undefined;
  const role = (session.user as any).role as string | undefined;
  const isPlatformAdmin = role === 'SUPER_ADMIN' || (role === 'ADMIN' && !sessOrgId);
  if (isPlatformAdmin && qOrgId) return qOrgId;
  return sessOrgId ?? null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const denied = await guardPermission(session.user.id, 'work_orders.read');
  if (denied) return denied;

  const url = new URL(req.url);
  const includeArchived = url.searchParams.get('includeArchived') === '1';
  const orgId = await resolveOrgId(session, url.searchParams.get('orgId'));
  if (!orgId) return NextResponse.json({ error: 'No organization in session' }, { status: 400 });

  const templates = await db.workOrderTemplate.findMany({
    where: {
      organizationId: orgId,
      ...(includeArchived ? {} : { isArchived: false }),
    },
    orderBy: [{ isArchived: 'asc' }, { updatedAt: 'desc' }],
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const denied = await guardPermission(session.user.id, 'work_orders.create');
  if (denied) return denied;

  const url = new URL(req.url);
  const orgId = await resolveOrgId(session, url.searchParams.get('orgId'));
  if (!orgId) return NextResponse.json({ error: 'No organization in session' }, { status: 400 });

  const body = await req.json();
  const {
    name,
    title,
    description,
    type,
    priority,
    estimatedMinutes,
    laborCost,
    partsCost,
    currency,
    notes,
  } = body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Default work-order title is required' }, { status: 400 });
  }

  const created = await db.workOrderTemplate.create({
    data: {
      name: name.trim(),
      title: title.trim(),
      description: description?.toString().trim() || null,
      type: (type as any) ?? 'PREVENTIVE',
      priority: (priority as any) ?? 'MEDIUM',
      estimatedMinutes: estimatedMinutes != null && String(estimatedMinutes).trim() !== ''
        ? parseInt(String(estimatedMinutes), 10) : null,
      laborCost: laborCost != null && String(laborCost).trim() !== ''
        ? parseFloat(String(laborCost)) : null,
      partsCost: partsCost != null && String(partsCost).trim() !== ''
        ? parseFloat(String(partsCost)) : null,
      currency: currency || 'USD',
      notes: notes?.toString().trim() || null,
      organizationId: orgId,
      createdById: session.user.id,
    },
  });

  // Fire-and-forget audit log
  logAuditEvent({
    action: 'WO_TEMPLATE_CREATED',
    entity: 'WorkOrderTemplate',
    entityId: created.id,
    userId: session.user.id,
    organizationId: orgId,
    metadata: { name: created.name },
  }).catch(() => {});

  return NextResponse.json({ template: created }, { status: 201 });
}
