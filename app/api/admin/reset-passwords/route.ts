import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const RESET_SECRET = 'myncel-reset-2024-secure';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.secret !== RESET_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If specific email + password provided, reset just that user
    if (body.email && body.password) {
      const hash = await bcrypt.hash(body.password, 12);
      const user = await db.user.update({
        where: { email: body.email },
        data: { password: hash },
        select: { id: true, email: true, password: true },
      });
      const verified = await bcrypt.compare(body.password, user.password!);
      return NextResponse.json({
        success: true,
        email: user.email,
        verified,
        newHashPrefix: user.password?.substring(0, 20),
      });
    }

    // Reset both accounts with same password if provided
    const password = body.newPassword || 'Emperor1980&';
    const results: Record<string, any> = {};

    for (const email of ['admin@myncel.com', 'kellytron@yahoo.com']) {
      const hash = await bcrypt.hash(password, 12);
      const user = await db.user.update({
        where: { email },
        data: { password: hash },
        select: { id: true, email: true, password: true },
      });
      const verified = await bcrypt.compare(password, user.password!);
      results[email] = { passwordReset: true, verified, newHashPrefix: user.password?.substring(0, 20) };
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use POST with secret' }, { status: 405 });
}