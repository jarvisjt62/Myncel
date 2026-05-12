import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { db, safeQuery } from './db';

export const PLATFORM_ADMIN_EMAIL = 'admin@myncel.com';

export async function getPlatformAdminContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { session: null, user: null, isAdmin: false, adminOrgId: null as string | null };
  }
  const user = await safeQuery(
    db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, organizationId: true, role: true, name: true },
    }),
    null
  );
  const isAdmin = user?.email === PLATFORM_ADMIN_EMAIL;
  return {
    session,
    user,
    isAdmin,
    adminOrgId: isAdmin ? user?.organizationId || null : null,
  };
}

/**
 * Resolve which organization ID the caller is allowed to operate on.
 *
 * - If platform admin AND they passed `targetOrgId` → use targetOrgId (admin override)
 * - Else → use the caller's own organizationId
 *
 * Returns null if the caller doesn't have an org at all.
 */
export async function resolveTargetOrgId(requestedTargetOrgId?: string | null) {
  const { user, isAdmin } = await getPlatformAdminContext();
  if (!user) return { targetOrgId: null as string | null, isAdmin: false, user: null };

  if (isAdmin && requestedTargetOrgId) {
    return { targetOrgId: requestedTargetOrgId, isAdmin: true, user };
  }
  return { targetOrgId: user.organizationId, isAdmin, user };
}
