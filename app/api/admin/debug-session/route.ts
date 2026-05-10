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

    const userByEmail = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, email: true, name: true, role: true, organizationId: true },
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
      env: {
        NEXTAUTH_URL_set: !!process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
        DATABASE_URL_set: !!process.env.DATABASE_URL,
        DIRECT_URL_set: !!process.env.DIRECT_URL,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}