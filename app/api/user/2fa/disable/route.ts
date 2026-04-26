import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyTOTPCode, verifyBackupCode } from '@/lib/two-factor-auth';
import { AuditLog } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

// POST - Disable 2FA
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, password } = await req.json();

    if (!code && !password) {
      return NextResponse.json({ 
        error: 'Either 2FA code or password is required' 
      }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
        password: true,
      },
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 });
    }

    let isVerified = false;

    if (code && user.twoFactorSecret) {
      if (code.length === 6) {
        isVerified = verifyTOTPCode(user.twoFactorSecret, code);
      } else if (code.length === 8 && user.twoFactorBackupCodes) {
        const hashedCodes = JSON.parse(user.twoFactorBackupCodes);
        isVerified = verifyBackupCode(hashedCodes, code.toUpperCase());
      }
    } else if (password && user.password) {
      const bcrypt = require('bcryptjs');
      isVerified = await bcrypt.compare(password, user.password);
    }

    if (!isVerified) {
      return NextResponse.json({ error: 'Invalid verification' }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    await AuditLog.twoFactorDisabled(session.user.id, req as any);

    return NextResponse.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
  }
}