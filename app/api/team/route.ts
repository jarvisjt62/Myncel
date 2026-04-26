import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

// GET - List team members
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { organizationId: true, role: true }
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get all team members
    const members = await safeQuery(
      db.user.findMany({
        where: { organizationId: user.organizationId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          lastLoginAt: true
        },
        orderBy: [
          { role: 'asc' }, // Owner first, then Admin, etc.
          { createdAt: 'asc' }
        ]
      }),
      []
    );

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Invite team member (placeholder - would need email service)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, role = 'MEMBER' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user's organization and check permissions
    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { organizationId: true, role: true }
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Only owners and admins can invite
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only owners and admins can invite team members' }, { status: 403 });
    }

    // Check if user already exists
    const existingUser = await safeQuery(
      db.user.findUnique({
        where: { email }
      }),
      null
    );

    if (existingUser) {
      if (existingUser.organizationId === user.organizationId) {
        return NextResponse.json({ error: 'User is already a team member' }, { status: 400 });
      }
      return NextResponse.json({ error: 'User is already in another organization' }, { status: 400 });
    }

    // Create pending user (would normally send email invite)
    // For now, just create the user with a random password that they'll need to reset
    const bcrypt = await import('bcryptjs');
    const tempPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await safeQuery(
      db.user.create({
        data: {
          email,
          name: email.split('@')[0],
          role: role as any,
          password: hashedPassword,
          organization: { connect: { id: user.organizationId } }
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      }),
      null
    );

    return NextResponse.json({
      message: 'Team member invited successfully',
      member: newUser,
      tempPassword // In production, this would be sent via email
    });
  } catch (error) {
    console.error('Error inviting team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}