import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { safeQuery } from '@/lib/admin-helpers';
import AdminAccountClient from './AdminAccountClient';

// Force dynamic rendering to avoid caching
export const dynamic = 'force-dynamic';

export default async function AdminAccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const admin = await safeQuery(
    db.user.findUnique({
      where: { email: session.user.email! },
      include: { organization: true },
    }),
    null
  );

  if (!admin) redirect('/signin');

  return (
    <AdminAccountClient
      user={{
        id: admin.id,
        name: admin.name || '',
        email: admin.email || '',
        role: admin.role,
        createdAt: admin.createdAt.toISOString(),
        organization: admin.organization ? {
          name: admin.organization.name,
          plan: admin.organization.plan,
        } : null,
      }}
    />
  );
}