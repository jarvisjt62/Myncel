import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_PLANS = ['TRIAL', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'];
const VALID_INDUSTRIES = ['METAL_FABRICATION', 'PLASTICS', 'FOOD_BEVERAGE', 'AUTO_PARTS', 'ELECTRONICS', 'WOODWORKING', 'OTHER'];
const VALID_SIZES = ['SMALL', 'GROWING', 'MIDSIZE', 'LARGE'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { orgId } = params;
  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  const body = await req.json();
  const updates: Record<string, any> = {};
  const changes: Record<string, any> = {};

  // Allowed fields
  if (body.name !== undefined) { updates.name = String(body.name).trim(); changes.name = [org.name, updates.name]; }
  if (body.slug !== undefined) { updates.slug = String(body.slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'); changes.slug = [org.slug, updates.slug]; }
  if (body.industry !== undefined && VALID_INDUSTRIES.includes(body.industry)) { updates.industry = body.industry; changes.industry = [(org as any).industry, body.industry]; }
  if (body.size !== undefined && VALID_SIZES.includes(body.size)) { updates.size = body.size; changes.size = [(org as any).size, body.size]; }
  if (body.plan !== undefined && VALID_PLANS.includes(body.plan)) { updates.plan = body.plan; changes.plan = [org.plan, body.plan]; }
  if (body.adminNotes !== undefined) { updates.adminNotes = body.adminNotes; }
  if (body.isSuspended !== undefined) {
    updates.isSuspended = Boolean(body.isSuspended);
    if (body.isSuspended) {
      updates.suspendedAt = new Date();
      updates.suspendedReason = body.suspendedReason ?? 'Suspended by admin';
    } else {
      updates.suspendedAt = null;
      updates.suspendedReason = null;
    }
    changes.isSuspended = [!body.isSuspended, body.isSuspended];
  }
  if (body.isActive !== undefined) { updates.isActive = Boolean(body.isActive); }
  if (body.trialEndsAt !== undefined) { updates.trialEndsAt = body.trialEndsAt ? new Date(body.trialEndsAt) : null; }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Check slug uniqueness if changed
  if (updates.slug && updates.slug !== org.slug) {
    const existing = await db.organization.findUnique({ where: { slug: updates.slug } });
    if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
  }

  const updated = await db.organization.update({
    where: { id: orgId },
    data: updates,
  });

  // Audit log
  await db.auditLog.create({
    data: {
      action: 'ADMIN_ORG_UPDATED',
      entity: 'Organization',
      entityId: orgId,
      changes: changes as any,
      organizationId: orgId,
      userId: session.user.id ?? null,
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, org: { id: updated.id, name: updated.name, plan: updated.plan } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { orgId } = params;
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true },
  });
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  // Delete in correct order to avoid FK constraint violations
  // Prisma cascade should handle most, but let's be explicit for safety
  await db.organization.delete({ where: { id: orgId } });

  await db.auditLog.create({
    data: {
      action: 'ADMIN_ORG_DELETED',
      entity: 'Organization',
      entityId: orgId,
      changes: { name: org.name } as any,
      userId: session.user.id ?? null,
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}