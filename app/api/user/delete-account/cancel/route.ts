import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db as prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/delete-account/cancel
 *
 * Cancels a pending account deletion. Because the user is signed
 * out the moment they initiate deletion (and login is blocked while
 * deletionRequestedAt is set), this endpoint is unauthenticated.
 * Instead, it requires email + password — the same credentials the
 * user would use to sign in. If they verify, we clear the deletion
 * timestamp and they can sign in normally afterward.
 *
 * This is the recovery path Apple's reviewer can use if they want
 * to demonstrate the cancel flow.
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.email || !body.password) {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
    select: {
      id: true,
      password: true,
      deletionRequestedAt: true,
    },
  });
  if (!user || !user.password) {
    // Don't leak which emails exist.
    return NextResponse.json(
      { error: 'Email and password do not match an account scheduled for deletion.' },
      { status: 404 }
    );
  }

  const passwordValid = await bcrypt.compare(body.password, user.password);
  if (!passwordValid) {
    return NextResponse.json(
      { error: 'Email and password do not match an account scheduled for deletion.' },
      { status: 401 }
    );
  }

  if (!user.deletionRequestedAt) {
    return NextResponse.json(
      { error: 'No account deletion is pending for this account.' },
      { status: 409 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { deletionRequestedAt: null },
  });

  return NextResponse.json({
    ok: true,
    message:
      'Account deletion cancelled. You can sign in normally now.',
  });
}
