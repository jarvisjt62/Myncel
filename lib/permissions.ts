/**
 * Permissions helpers for the custom RBAC system.
 *
 * Usage:
 *   import { getUserPermissions, hasPermission } from '@/lib/permissions';
 *
 *   const perms = await getUserPermissions(userId);
 *   if (!perms.has('work_orders.delete')) throw new Error('Forbidden');
 *
 * Rules:
 *   - admin@myncel.com (platform admin) always has every permission.
 *   - A user's effective permissions = union of every permission in every role
 *     assigned to them via UserRoleAssignment +
 *     the default permissions for their legacy UserRole enum value (via its
 *     matching system role slug).
 *   - Disabled roles (isDisabled=true) are ignored, so a platform-admin can
 *     suspend a role without deleting it.
 */

import { db } from '@/lib/db';

const PLATFORM_ADMIN_EMAIL = 'admin@myncel.com';

/** Map legacy UserRole enum → system role slug so enum users still get perms. */
const ENUM_TO_SLUG: Record<string, string> = {
  SUPER_ADMIN: 'owner',
  OWNER: 'owner',
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  OPERATOR: 'operator',
  EMPLOYEE: 'employee',
  MEMBER: 'member',
};

export type PermissionSet = {
  has: (key: string) => boolean;
  keys: string[];
  isPlatformAdmin: boolean;
};

const EMPTY: PermissionSet = { has: () => false, keys: [], isPlatformAdmin: false };

/**
 * Returns the effective permission set for a user.
 * Safe on missing user. Platform admin short-circuits to "has every permission".
 */
export async function getUserPermissions(userId: string | null | undefined): Promise<PermissionSet> {
  if (!userId) return EMPTY;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      roleAssignments: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: { select: { key: true } } } },
            },
          },
        },
      },
    },
  });
  if (!user) return EMPTY;

  // Platform admin bypass
  if (user.email === PLATFORM_ADMIN_EMAIL) {
    return {
      has: () => true,
      keys: ['*'],
      isPlatformAdmin: true,
    };
  }

  const keys = new Set<string>();

  // 1. Assigned custom / system roles
  for (const a of user.roleAssignments) {
    if (a.role.isDisabled) continue;
    for (const rp of a.role.permissions) keys.add(rp.permission.key);
  }

  // 2. Fall back to default system role from the legacy enum so existing users
  //    still have sane permissions before any assignments are created.
  const fallbackSlug = ENUM_TO_SLUG[user.role];
  if (fallbackSlug) {
    const fallbackRole = await db.role.findFirst({
      where: { slug: fallbackSlug, organizationId: null, isSystem: true, isDisabled: false },
      include: { permissions: { include: { permission: { select: { key: true } } } } },
    });
    if (fallbackRole) {
      for (const rp of fallbackRole.permissions) keys.add(rp.permission.key);
    }
  }

  const arr = Array.from(keys);
  return {
    has: (k: string) => keys.has(k),
    keys: arr,
    isPlatformAdmin: false,
  };
}

/** Convenience: true if the user has the given permission. */
export async function hasPermission(userId: string | null | undefined, key: string): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  return perms.has(key);
}

/** Throw a 403-style error when a permission is missing. For use in API routes. */
export async function requirePermission(userId: string | null | undefined, key: string) {
  const ok = await hasPermission(userId, key);
  if (!ok) {
    const err = new Error(`Forbidden: missing permission "${key}"`);
    (err as any).status = 403;
    throw err;
  }
}

/**
 * Route helper: runs requirePermission and, on failure, returns a NextResponse
 * 403. On success returns null so the caller can continue.
 *
 *   const denied = await guardPermission(session.user.id, 'work_orders.create');
 *   if (denied) return denied;
 */
import { NextResponse } from 'next/server';
export async function guardPermission(
  userId: string | null | undefined,
  key: string,
): Promise<NextResponse | null> {
  const ok = await hasPermission(userId, key);
  if (ok) return null;
  return NextResponse.json(
    { error: `Forbidden: missing permission "${key}"`, permission: key },
    { status: 403 },
  );
}
