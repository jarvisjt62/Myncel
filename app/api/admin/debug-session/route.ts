import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No session found', session: null });
    }

    // Try to find the user in DB by both email and id
    const userByEmail = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, email: true, name: true, role: true, organizationId: true, password: true },
    }).catch(e => ({ error: String(e) }));
    
    // Check admin password hash directly
    const adminUser = await db.user.findUnique({
      where: { email: 'admin@myncel.com' },
      select: { id: true, password: true },
    }).catch(e => ({ error: String(e) }));

    const userById = session.user.id ? await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true, organizationId: true },
    }).catch(e => ({ error: String(e) })) : null;

    return NextResponse.json({
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          organizationId: session.user.organizationId,
          organizationName: session.user.organizationName,
        },
        expires: session.expires,
      },
      dbUserByEmail: userByEmail,
      dbUserById: userById,
      adminPasswordHash: (adminUser as any)?.password?.substring(0, 20) + '...' || (adminUser as any)?.error,
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        secretFirstChars: process.env.NEXTAUTH_SECRET?.substring(0, 10),
        DATABASE_URL_first: process.env.DATABASE_URL?.substring(0, 80),
        DATABASE_URL_port: process.env.DATABASE_URL?.match(/:(\d+)\//)?.[1] || 'unknown',
        DIRECT_URL_set: !!process.env.DIRECT_URL,
        DIRECT_URL_port: process.env.DIRECT_URL?.match(/:(\d+)\//)?.[1] || 'not set',
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}