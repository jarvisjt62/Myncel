import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/auth/check-verification — Check if a user needs email verification
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ needsVerification: false }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { emailVerified: true, email: true },
    });

    // Admin always bypasses verification
    if (!user || user.email === 'admin@myncel.com') {
      return NextResponse.json({ needsVerification: false });
    }

    // Only reveal verification status if the user exists AND is unverified
    // This prevents user enumeration attacks
    if (!user.emailVerified) {
      return NextResponse.json({ needsVerification: true });
    }

    // User doesn't exist or is already verified — return false to show generic error
    return NextResponse.json({ needsVerification: false });
  } catch (error) {
    console.error('Check verification error:', error);
    return NextResponse.json({ needsVerification: false }, { status: 500 });
  }
}