import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendTeamInviteEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// POST /api/team/invite — send an invite to a new team member
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, role = 'TECHNICIAN' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const validRoles = ['TECHNICIAN', 'ADMIN', 'MEMBER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get inviter info + org
    const inviter = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, role: true, organizationId: true, organization: { select: { name: true, id: true } } },
    });

    if (!inviter?.organizationId || !inviter.organization) {
      return NextResponse.json({ error: 'You must belong to an organization to invite members' }, { status: 400 });
    }

    // Only OWNER or ADMIN can invite
    if (inviter.role !== 'OWNER' && inviter.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only organization owners and admins can send invitations' }, { status: 403 });
    }

    // Check if user already exists in this org
    const existing = await db.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      if (existing.organizationId === inviter.organizationId) {
        return NextResponse.json({ error: 'This person is already a member of your organization' }, { status: 400 });
      }
      return NextResponse.json({ error: 'This email is already registered with another organization' }, { status: 400 });
    }

    // Check for existing pending invite to this org
    const pendingInvite = await db.inviteToken.findFirst({
      where: {
        email: emailLower,
        organizationId: inviter.organizationId,
        used: false,
        expires: { gt: new Date() },
      },
    });

    if (pendingInvite) {
      return NextResponse.json({ error: 'A pending invitation already exists for this email' }, { status: 400 });
    }

    // Create invite token (expires in 48 hours)
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const invite = await db.inviteToken.create({
      data: {
        email: emailLower,
        role: role as 'TECHNICIAN' | 'ADMIN' | 'MEMBER',
        organizationId: inviter.organizationId,
        invitedById: session.user.id,
        expires,
      },
    });

    // Send invite email
    await sendTeamInviteEmail(
      emailLower,
      invite.token,
      inviter.name || inviter.email || 'Your manager',
      inviter.organization.name,
      role
    );

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${emailLower}`,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expires: invite.expires,
      },
    });
  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}

// DELETE /api/team/invite?id=xxx — revoke an invite
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const inviteId = searchParams.get('id');
    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID required' }, { status: 400 });
    }

    const inviter = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, organizationId: true },
    });

    if (!inviter?.organizationId || (inviter.role !== 'OWNER' && inviter.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const invite = await db.inviteToken.findUnique({ where: { id: inviteId } });
    if (!invite || invite.organizationId !== inviter.organizationId) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Mark as used (effectively revokes it)
    await db.inviteToken.update({ where: { id: inviteId }, data: { used: true } });

    return NextResponse.json({ success: true, message: 'Invitation revoked' });
  } catch (error) {
    console.error('Error revoking invite:', error);
    return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 });
  }
}

// GET /api/team/invite — list pending invites for the org
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, organizationId: true },
    });

    if (!user?.organizationId || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const invites = await db.inviteToken.findMany({
      where: {
        organizationId: user.organizationId,
        used: false,
        expires: { gt: new Date() },
      },
      include: { invitedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
}