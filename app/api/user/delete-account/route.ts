import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/delete-account
 *
 * Initiates account deletion. The user must be signed in and must
 * supply their current password to re-authenticate the action.
 *
 * Required by Apple App Review Guideline 5.1.1(v): apps that allow
 * account creation must allow in-app account deletion.
 *
 * Behavior:
 *   1. Verify session.
 *   2. Re-verify password (Apple's "confirmation steps").
 *   3. If user is OWNER of an organization that has other members,
 *      block deletion until they transfer ownership or remove other
 *      members. This prevents orphaning a workspace.
 *   4. Set users.deletionRequestedAt = now(). The user is signed
 *      out by the client immediately after this returns success.
 *      Login is blocked while this field is set (see lib/auth.ts).
 *   5. After 14 days, /api/cron/purge-deleted-accounts hard-deletes
 *      the row and all related data (cascade through Prisma
 *      relations).
 *
 * GET /api/user/delete-account
 *
 * Returns the current deletion status for the signed-in user, so the
 * settings UI can show "Account deletion pending — X days remaining"
 * and a Cancel button.
 */

const GRACE_DAYS = 14;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { deletionRequestedAt: true, role: true, organizationId: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Compute whether this user is blocked from initiating deletion
  // because they own a multi-user workspace.
  let blockReason: string | null = null;
  if (user.role === 'OWNER' && user.organizationId) {
    const otherMembers = await prisma.user.count({
      where: {
        organizationId: user.organizationId,
        NOT: { id: session.user.id },
      },
    });
    if (otherMembers > 0) {
      blockReason =
        'You are the owner of an organization with other members. Transfer ownership or remove the other members before deleting your account.';
    }
  }

  let scheduledFor: string | null = null;
  let daysRemaining: number | null = null;
  if (user.deletionRequestedAt) {
    const target = new Date(user.deletionRequestedAt.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
    scheduledFor = target.toISOString();
    daysRemaining = Math.max(
      0,
      Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
  }

  return NextResponse.json({
    pending: Boolean(user.deletionRequestedAt),
    requestedAt: user.deletionRequestedAt?.toISOString() ?? null,
    scheduledFor,
    daysRemaining,
    graceDays: GRACE_DAYS,
    blockReason,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { password?: string; confirm?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.confirm !== 'DELETE') {
    return NextResponse.json(
      { error: 'You must type DELETE in the confirm field to proceed.' },
      { status: 400 }
    );
  }
  if (!body.password || typeof body.password !== 'string') {
    return NextResponse.json(
      { error: 'Password is required to delete your account.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      organizationId: true,
      deletionRequestedAt: true,
    },
  });
  if (!user || !user.password) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (user.deletionRequestedAt) {
    return NextResponse.json(
      { error: 'Account deletion is already pending.' },
      { status: 409 }
    );
  }

  // Re-authenticate with password (Apple "confirmation steps").
  const passwordValid = await bcrypt.compare(body.password, user.password);
  if (!passwordValid) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  // Block ownership orphaning.
  if (user.role === 'OWNER' && user.organizationId) {
    const otherMembers = await prisma.user.count({
      where: {
        organizationId: user.organizationId,
        NOT: { id: user.id },
      },
    });
    if (otherMembers > 0) {
      return NextResponse.json(
        {
          error:
            'You are the owner of an organization with other members. Transfer ownership or remove the other members before deleting your account.',
        },
        { status: 409 }
      );
    }
  }

  const now = new Date();
  const scheduledFor = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      deletionRequestedAt: now,
      // Best-effort: revoke any active sessions so the user is signed
      // out everywhere. The client will also call signOut() after
      // this returns, but covering the multi-device case here too.
    },
  });

  // Best-effort: revoke any other NextAuth DB sessions. Not all
  // installations use the DB session strategy, so a failure is fine.
  try {
    await prisma.session.deleteMany({ where: { userId: user.id } });
  } catch {
    // ignore
  }

  return NextResponse.json({
    ok: true,
    requestedAt: now.toISOString(),
    scheduledFor: scheduledFor.toISOString(),
    graceDays: GRACE_DAYS,
    message: `Your account is scheduled for permanent deletion on ${scheduledFor.toISOString().split('T')[0]}. You will be signed out now.`,
  });
}
