import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_ROLES = ['OWNER', 'ADMIN', 'TECHNICIAN', 'MEMBER'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { userId } = params;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const updates: Record<string, any> = {};
  const changes: Record<string, any> = {};

  if (body.role !== undefined && VALID_ROLES.includes(body.role)) {
    updates.role = body.role;
    changes.role = [user.role, body.role];
  }
  if (body.failedLoginAttempts !== undefined) {
    updates.failedLoginAttempts = Number(body.failedLoginAttempts);
    updates.lockedUntil = null; // Also clear lockout
    changes.failedLoginAttempts = [user.failedLoginAttempts, 0];
  }
  if (body.name !== undefined) {
    updates.name = String(body.name).trim();
    changes.name = [user.name, updates.name];
  }
  if (body.twoFactorEnabled !== undefined) {
    updates.twoFactorEnabled = Boolean(body.twoFactorEnabled);
    if (!body.twoFactorEnabled) {
      updates.twoFactorSecret = null;
      updates.twoFactorBackupCodes = null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  await db.user.update({ where: { id: userId }, data: updates });

  // Audit log
  await db.auditLog.create({
    data: {
      action: 'ADMIN_USER_UPDATED',
      entity: 'User',
      entityId: userId,
      changes: changes as any,
      organizationId: user.organizationId ?? null,
      userId: session.user.id ?? null,
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { userId } = params;

  // Prevent deleting the admin account itself
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, organizationId: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.email === 'admin@myncel.com') {
    return NextResponse.json({ error: 'Cannot delete the super admin account' }, { status: 403 });
  }

  await db.user.delete({ where: { id: userId } });

  await db.auditLog.create({
    data: {
      action: 'ADMIN_USER_DELETED',
      entity: 'User',
      entityId: userId,
      changes: { email: user.email, name: user.name } as any,
      organizationId: user.organizationId ?? null,
      userId: session.user.id ?? null,
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}