import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

// PATCH - Update team member role
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await req.json();
    const targetUserId = params.id;

    if (!role || !['OWNER', 'ADMIN', 'TECHNICIAN', 'MEMBER'].includes(role)) {
      return NextResponse.json({ error: 'Valid role is required' }, { status: 400 });
    }

    // Get current user
    const currentUser = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { id: true, organizationId: true, role: true }
      }),
      null
    );

    if (!currentUser?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Only owners and admins can change roles
    if (currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only owners and admins can change roles' }, { status: 403 });
    }

    // Get target user
    const targetUser = await safeQuery(
      db.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, organizationId: true, role: true }
      }),
      null
    );

    if (!targetUser || targetUser.organizationId !== currentUser.organizationId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot change owner's role
    if (targetUser.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 });
    }

    // Only owner can assign admin role
    if (role === 'ADMIN' && currentUser.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can assign admin role' }, { status: 403 });
    }

    // Update role
    const updated = await safeQuery(
      db.user.update({
        where: { id: targetUserId },
        data: { role: role as any },
        select: { id: true, name: true, email: true, role: true }
      }),
      null
    );

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove team member
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = params.id;

    // Get current user
    const currentUser = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { id: true, organizationId: true, role: true }
      }),
      null
    );

    if (!currentUser?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Only owners and admins can remove members
    if (currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only owners and admins can remove members' }, { status: 403 });
    }

    // Get target user
    const targetUser = await safeQuery(
      db.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, organizationId: true, role: true }
      }),
      null
    );

    if (!targetUser || targetUser.organizationId !== currentUser.organizationId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot remove owner
    if (targetUser.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove owner' }, { status: 400 });
    }

    // Remove user from organization (set organizationId to null)
    await safeQuery(
      db.user.update({
        where: { id: targetUserId },
        data: { organizationId: null, role: 'MEMBER' }
      }),
      null
    );

    return NextResponse.json({ success: true, message: 'Team member removed' });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}