/**
 * Permission gate — mirrors the web app's <Can permission="..."> component.
 * OWNER and ADMIN bypass permission checks (full access).
 */

import React from 'react';
import { useAuth } from './AuthContext';

export function hasPermission(
  user: { role: string; permissions: string[] } | null,
  permission: string
): boolean {
  if (!user) return false;
  if (user.role === 'OWNER' || user.role === 'ADMIN') return true;
  return user.permissions.includes(permission);
}

type CanProps = {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function Can({ permission, children, fallback = null }: CanProps) {
  const { user } = useAuth();
  return <>{hasPermission(user, permission) ? children : fallback}</>;
}
