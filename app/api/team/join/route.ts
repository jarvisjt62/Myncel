import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// GET /api/team/join?token=xxx — validate invite token (for the join page)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const invite = await db.inviteToken.findUnique({
      where: { token },
      include: {
        organization: { select: { name: true, industry: true } },
        invitedBy: { select: { name: true, email: true } },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or expired invitation link' }, { status: 404 });
    }

    if (invite.used) {
      return NextResponse.json({ error: 'This invitation has already been used' }, { status: 400 });
    }

    if (invite.expires < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired. Please request a new one.' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      email: invite.email,
      role: invite.role,
      organization: invite.organization,
      invitedBy: invite.invitedBy,
      expires: invite.expires,
    });
  } catch (error) {
    console.error('Error validating invite token:', error);
    return NextResponse.json({ error: 'Failed to validate invitation' }, { status: 500 });
  }
}

// POST /api/team/join — complete registration via invite
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, name, password } = body;

    if (!token || !name || !password) {
      return NextResponse.json({ error: 'Token, name, and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your full name' }, { status: 400 });
    }

    // Validate token
    const invite = await db.inviteToken.findUnique({
      where: { token },
      include: {
        organization: { select: { name: true, id: true } },
        invitedBy: { select: { name: true, email: true } },
      },
    });

    if (!invite || invite.used || invite.expires < new Date()) {
      return NextResponse.json({ error: 'This invitation is invalid or has expired' }, { status: 400 });
    }

    // Check if email was already registered
    const existing = await db.user.findUnique({ where: { email: invite.email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and mark invite as used in a transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: invite.email,
          password: hashedPassword,
          role: invite.role,
          organizationId: invite.organizationId,
          emailVerified: new Date(), // auto-verify since they clicked the invite link
        },
      });

      // Mark invite as used
      await tx.inviteToken.update({
        where: { id: invite.id },
        data: { used: true },
      });

      // Create welcome notification
      await tx.notification.create({
        data: {
          userId: newUser.id,
          type: 'WORK_ORDER_ASSIGNED',
          title: `Welcome to ${invite.organization.name}!`,
          message: `You've joined ${invite.organization.name} as a ${invite.role.toLowerCase()}. You can now view and manage your assigned tasks.`,
          priority: 'NORMAL',
          link: '/dashboard',
        },
      });

      return newUser;
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email!, user.name!, invite.organization.name).catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now sign in.',
      email: user.email,
    });
  } catch (error) {
    console.error('Error completing registration:', error);
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}