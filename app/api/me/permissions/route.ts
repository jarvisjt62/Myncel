import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserPermissions } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me/permissions
 * Returns the effective permission keys for the current user, plus a few
 * useful flags the client UI needs to decide which buttons to render.
 *
 * Safe to call from anywhere — if the user isn't logged in, responds 401.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const perms = await getUserPermissions(session.user.id);
  return NextResponse.json({
    keys: perms.keys,
    isPlatformAdmin: perms.isPlatformAdmin,
  });
}
