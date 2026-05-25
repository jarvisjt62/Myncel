/**
 * /api/work-order-templates/[id]
 *
 * GET    → fetch one template
 * PUT    → update (rename, change defaults, archive/unarchive)
 * DELETE → permanent delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { guardPermission } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

async function loadTemplateForSession(session: any, id: string) {
  const sessOrgId = (session.user as any).organizationId as string | undefined;
  const role = (session.user as any).role as string | undefined;
  const isPlatformAdmin = role === 'SUPER_ADMIN' || (role === 'ADMIN' && !sessOrgId);

  const tpl = await db.workOrderTemplate.findUnique({
    where: { id },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  if (!tpl) return { tpl: null, allowed: false };
  if (!isPlatformAdmin && tpl.organizationId !== sessOrgId) {
    return { tpl, allowed: false };
  }
  return { tpl, allowed: true };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const denied = await guardPermission(session.user.id, 'work_orders.read');
  if (denied) return denied;

  const { id } = await params;
  const { tpl, allowed } = await loadTemplateForSession(session, id);
  if (!tpl) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ template: tpl });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const denied = await guardPermission(session.user.id, 'work_orders.update');
  if (denied) return denied;

  const { id } = await params;
  const { tpl, allowed } = await loadTemplateForSession(session, id);
  if (!tpl) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const data: any = {};

  if (body.name != null) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Template name cannot be empty' }, { status: 400 });
    }
    data.name = body.name.trim();
  }
  if (body.title != null) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'Default title cannot be empty' }, { status: 400 });
    }
    data.title = body.title.trim();
  }
  if (body.description !== undefined) data.description = body.description?.toString().trim() || null;
  if (body.type !== undefined)        data.type = body.type;
  if (body.priority !== undefined)    data.priority = body.priority;
  if (body.notes !== undefined)       data.notes = body.notes?.toString().trim() || null;
  if (body.currency !== undefined)    data.currency = body.currency || 'USD';
  if (body.isArchived !== undefined)  data.isArchived = !!body.isArchived;
  if (body.estimatedMinutes !== undefined) {
    data.estimatedMinutes = body.estimatedMinutes != null && String(body.estimatedMinutes).trim() !== ''
      ? parseInt(String(body.estimatedMinutes), 10) : null;
  }
  if (body.laborCost !== undefined) {
    data.laborCost = body.laborCost != null && String(body.laborCost).trim() !== ''
      ? parseFloat(String(body.laborCost)) : null;
  }
  if (body.partsCost !== undefined) {
    data.partsCost = body.partsCost != null && String(body.partsCost).trim() !== ''
      ? parseFloat(String(body.partsCost)) : null;
  }

  const updated = await db.workOrderTemplate.update({ where: { id }, data });

  logAuditEvent({
    action: 'WO_TEMPLATE_UPDATED',
    entity: 'WorkOrderTemplate',
    entityId: id,
    userId: session.user.id,
    organizationId: updated.organizationId,
    changes: data,
  }).catch(() => {});

  return NextResponse.json({ template: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const denied = await guardPermission(session.user.id, 'work_orders.delete');
  if (denied) return denied;

  const { id } = await params;
  const { tpl, allowed } = await loadTemplateForSession(session, id);
  if (!tpl) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db.workOrderTemplate.delete({ where: { id } });

  logAuditEvent({
    action: 'WO_TEMPLATE_DELETED',
    entity: 'WorkOrderTemplate',
    entityId: id,
    userId: session.user.id,
    organizationId: tpl.organizationId,
    metadata: { name: tpl.name },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
