import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery, getSuperAdminOrgId } from '@/lib/admin-helpers';
import AdminPartsClient from './AdminPartsClient';

export const dynamic = 'force-dynamic';

export default async function AdminParts() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const superAdminOrgId = await getSuperAdminOrgId();

  // Fetch all organizations with their parts
  const organizations = await safeQuery(
    db.organization.findMany({
      where: superAdminOrgId ? { id: { not: superAdminOrgId } } : {},
      orderBy: { name: 'asc' },
      include: {
        parts: {
          orderBy: { name: 'asc' },
        },
        _count: { select: { parts: true } },
      },
    }),
    []
  );

  return <AdminPartsClient organizations={organizations as any} />;
}