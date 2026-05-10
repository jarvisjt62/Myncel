import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomBytes, createHash } from 'crypto';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MANAGE_DEVICE_TOKEN_ROLES = new Set(['OWNER', 'ADMIN', 'SUPER_ADMIN']);

function hashDeviceToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function createDeviceToken() {
  return `myncel_dt_${randomBytes(32).toString('hex')}`;
}

async function getAuthorizedMachine(machineId: string, session: any) {
  const machine = await db.machine.findUnique({
    where: { id: machineId },
    select: {
      id: true,
      name: true,
      organizationId: true,
      organization: { select: { id: true, name: true } },
    },
  });

  if (!machine) return { error: NextResponse.json({ error: 'Machine not found' }, { status: 404 }) };

  const role = session.user.role as string;
  const orgId = session.user.organizationId as string | undefined;
  const isSuperAdmin = role === 'SUPER_ADMIN' || session.user.email === 'admin@myncel.com';

  if (!isSuperAdmin && machine.organizationId !== orgId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  if (!isSuperAdmin && !MANAGE_DEVICE_TOKEN_ROLES.has(role)) {
    return { error: NextResponse.json({ error: 'Only owners and admins can manage device tokens' }, { status: 403 }) };
  }

  return { machine };
}

// GET /api/machines/[id]/device-token
// Lists token metadata only. Raw tokens are never returned after creation.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { machine, error } = await getAuthorizedMachine(params.id, session);
    if (error) return error;

    const tokens = await db.machineDeviceToken.findMany({
      where: { machineId: machine!.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        isActive: true,
        lastSeenAt: true,
        revokedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ machineId: machine!.id, machineName: machine!.name, tokens });
  } catch (error) {
    console.error('Device token list error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/machines/[id]/device-token
// Body: { name?: string }
// Creates a new device token and returns the raw token exactly once.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { machine, error } = await getAuthorizedMachine(params.id, session);
    if (error) return error;

    const body = await req.json().catch(() => ({}));
    const rawToken = createDeviceToken();
    const tokenHash = hashDeviceToken(rawToken);
    const tokenPrefix = `${rawToken.slice(0, 14)}…${rawToken.slice(-6)}`;

    const token = await db.machineDeviceToken.create({
      data: {
        name: String(body?.name || `${machine!.name} telemetry agent`).slice(0, 120),
        tokenHash,
        tokenPrefix,
        machineId: machine!.id,
        organizationId: machine!.organizationId,
      },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        isActive: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      machineId: machine!.id,
      machineName: machine!.name,
      token,
      deviceToken: rawToken,
      warning: 'Copy this deviceToken now. For security, Myncel stores only a hash and will not show the raw token again.',
    });
  } catch (error) {
    console.error('Device token create error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/machines/[id]/device-token?tokenId=...
// Revokes a token without deleting its audit metadata.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { machine, error } = await getAuthorizedMachine(params.id, session);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('tokenId');
    if (!tokenId) return NextResponse.json({ error: 'tokenId is required' }, { status: 400 });

    const existing = await db.machineDeviceToken.findFirst({
      where: { id: tokenId, machineId: machine!.id },
      select: { id: true },
    });

    if (!existing) return NextResponse.json({ error: 'Device token not found' }, { status: 404 });

    await db.machineDeviceToken.update({
      where: { id: tokenId },
      data: { isActive: false, revokedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Device token revoke error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}