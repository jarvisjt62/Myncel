import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/permissions/catalog — read-only catalog for any logged-in user.
// Used by the user-dashboard Roles tab and the admin Role editor.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const permissions = await db.permission.findMany({
    orderBy: [{ category: 'asc' }, { label: 'asc' }],
    select: { id: true, key: true, category: true, label: true, description: true, isCustom: true },
  });
  return NextResponse.json({ permissions });
}
