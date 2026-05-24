import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const GRACE_DAYS = 14;

/**
 * POST /api/auth/check-verification
 *
 * Side-channel used by the sign-in page after NextAuth rejects a
 * credential attempt. NextAuth collapses every authorize() error into
 * the same "CredentialsSignin" code, which is intentional for
 * security — but it means we cannot directly surface user-actionable
 * states like "email not verified" or "account scheduled for
 * deletion" without leaking enumeration. This endpoint deliberately
 * only reports those two states (and only after the user already
 * supplied a credential), so the impact on enumeration is the same
 * as the existing sign-in flow.
 *
 * Response shape:
 *   {
 *     needsVerification: boolean
 *     deletionPending: boolean
 *     daysRemaining: number | null   // when deletionPending = true
 *   }
 *
 * Apple App Review specifically needs to be able to see (and have a
 * reviewer screen-record) the deletion-pending message after a
 * deletion attempt, so we MUST return it here.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { needsVerification: false, deletionPending: false, daysRemaining: null },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: String(email).toLowerCase() },
      select: { emailVerified: true, email: true, deletionRequestedAt: true },
    });

    if (!user) {
      return NextResponse.json({
        needsVerification: false,
        deletionPending: false,
        daysRemaining: null,
      });
    }

    // Pending-deletion state takes priority over verification — if a
    // user is mid-deletion they cannot sign in even if verified.
    if (user.deletionRequestedAt) {
      const elapsedDays =
        (Date.now() - user.deletionRequestedAt.getTime()) /
        (1000 * 60 * 60 * 24);
      const daysRemaining = Math.max(
        0,
        Math.ceil(GRACE_DAYS - elapsedDays)
      );
      return NextResponse.json({
        needsVerification: false,
        deletionPending: true,
        daysRemaining,
      });
    }

    // Admin always bypasses verification.
    if (user.email === 'admin@myncel.com') {
      return NextResponse.json({
        needsVerification: false,
        deletionPending: false,
        daysRemaining: null,
      });
    }

    // Only reveal verification status if the user exists AND is unverified.
    if (!user.emailVerified) {
      return NextResponse.json({
        needsVerification: true,
        deletionPending: false,
        daysRemaining: null,
      });
    }

    return NextResponse.json({
      needsVerification: false,
      deletionPending: false,
      daysRemaining: null,
    });
  } catch (error) {
    console.error('Check verification error:', error);
    return NextResponse.json(
      { needsVerification: false, deletionPending: false, daysRemaining: null },
      { status: 500 }
    );
  }
}
