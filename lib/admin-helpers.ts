import { db } from '@/lib/db';

// Safe database query wrapper for admin pages
export async function safeQuery<T>(query: Promise<T>, fallback: T): Promise<T> {
  try {
    return await query;
  } catch (error) {
    console.error('Database query error:', error);
    return fallback;
  }
}

// Get the super admin's organization ID so we can exclude it from user-facing admin views
// The super admin is identified by email: admin@myncel.com
let _cachedSuperAdminOrgId: string | null | undefined = undefined;

export async function getSuperAdminOrgId(): Promise<string | null> {
  if (_cachedSuperAdminOrgId !== undefined) return _cachedSuperAdminOrgId;
  try {
    const org = await db.organization.findFirst({
      where: { users: { some: { email: 'admin@myncel.com' } } },
      select: { id: true },
    });
    _cachedSuperAdminOrgId = org?.id ?? null;
    return _cachedSuperAdminOrgId;
  } catch {
    return null;
  }
}

// Returns a Prisma where clause that excludes the super admin org
export async function excludeSuperAdminOrg(): Promise<{ organizationId?: { not: string } }> {
  const id = await getSuperAdminOrgId();
  return id ? { organizationId: { not: id } } : {};
}