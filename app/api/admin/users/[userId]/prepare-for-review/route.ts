import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Admin-only endpoint: prepare a user account for app-store review.
 *
 * One-click setup so the Google Play / Apple App Store reviewers can
 * sign in and walk through the app:
 *   1. Mark the user's email as verified (skips the inbox-link step)
 *   2. Clear any account lockout / failed-login counter
 *   3. Disable 2FA on the account (reviewers can't share a TOTP secret)
 *   4. Bump the user's organization to PROFESSIONAL plan with
 *      `trialEndsAt` 2 years out and `subscriptionStatus = 'active'`
 *      so no paywall blocks any feature
 *
 * POST /api/admin/users/[userId]/prepare-for-review
 *
 * Auth: must be the super-admin (admin@myncel.com).
 *
 * Used by the admin Users page "Prepare for Store Review" button so
 * the Myncel operator never has to run a script or touch the database
 * directly.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { userId } = params;
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (!user.organizationId) {
    return NextResponse.json(
      { error: 'User has no organization. Sign up flow normally creates one — please re-create the demo account via the public signup page.' },
      { status: 400 },
    );
  }

  // 1. Update the user
  await db.user.update({
    where: { id: userId },
    data: {
      emailVerified: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
    },
  });

  // 2. Update the org — Professional plan, 2-year horizon, fully active
  const trialEndsAt = new Date();
  trialEndsAt.setFullYear(trialEndsAt.getFullYear() + 2);

  await db.organization.update({
    where: { id: user.organizationId },
    data: {
      plan: 'PROFESSIONAL' as any,
      trialEndsAt,
      subscriptionStatus: 'active',
      currentPeriodEnd: trialEndsAt,
      isActive: true,
      isSuspended: false,
      cancelAtPeriodEnd: false,
    },
  });

  // 3. Audit log
  await db.auditLog.create({
    data: {
      action: 'ADMIN_PREPARED_FOR_STORE_REVIEW',
      entity: 'User',
      entityId: userId,
      changes: {
        emailVerified: true,
        twoFactorDisabled: true,
        plan: 'PROFESSIONAL',
        trialEndsAt: trialEndsAt.toISOString(),
      } as any,
      organizationId: user.organizationId,
      userId: session.user.id ?? null,
    },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    user: {
      email: user.email,
      organizationId: user.organizationId,
    },
    plan: 'PROFESSIONAL',
    trialEndsAt: trialEndsAt.toISOString(),
  });
}
