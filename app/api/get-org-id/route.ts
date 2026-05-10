import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await safeQuery(
    db.user.findUnique({
      where: { email: session.user.email || '' },
      select: { 
        id: true, 
        email: true, 
        name: true,
        organizationId: true,
        role: true
      }
    }),
    null
  );

  return NextResponse.json({ 
    userId: user?.id,
    email: user?.email,
    name: user?.name,
    organizationId: user?.organizationId 
  });
}