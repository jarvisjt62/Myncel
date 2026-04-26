import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
  generateTOTPSecret, 
  encryptSecret, 
  generateBackupCodes, 
  hashBackupCode,
  verifyTOTPCodeRaw 
} from '@/lib/two-factor-auth';
import { AuditLog } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

function decryptSecret(encryptedSecret: string): string {
  const crypto = require('crypto');
  const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || 'default-key-change-in-production-32ch!';
  const ALGORITHM = 'aes-256-gcm';
  
  const [ivHex, authTagHex, encrypted] = encryptedSecret.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// GET - Start 2FA setup
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({
        enabled: true,
        message: '2FA is already enabled.',
      });
    }

    const { secret, uri } = generateTOTPSecret(session.user.email || 'user@myncel.com');
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map(hashBackupCode);

    await db.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: encryptSecret(secret),
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
      },
    });

    return NextResponse.json({
      enabled: false,
      secret,
      uri,
      backupCodes,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 });
  }
}

// POST - Verify and enable 2FA
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA is already enabled' }, { status: 400 });
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json({ error: '2FA not set up. Call GET first.' }, { status: 400 });
    }

    const decryptedSecret = decryptSecret(user.twoFactorSecret);
    
    if (!verifyTOTPCodeRaw(decryptedSecret, code)) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: true },
    });

    await AuditLog.twoFactorEnabled(session.user.id, req as any);

    return NextResponse.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 });
  }
}