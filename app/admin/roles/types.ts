export interface PermissionDef {
  id: string;
  key: string;
  category: string;
  label: string;
  description?: string | null;
  isCustom?: boolean;
}

export interface RoleOrg {
  id: string;
  name: string;
  slug: string;
}

export interface RoleWithMeta {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isSystem: boolean;
  isGlobal: boolean;
  isDisabled: boolean;
  organizationId: string | null;
  organization: RoleOrg | null;
  createdAt: string | Date;
  permissions: { permission: PermissionDef }[];
  _count: { assignments: number };
}

export type ScopeFilter = 'all' | 'system' | 'global' | 'org';

export function groupByCategory(perms: PermissionDef[]): Record<string, PermissionDef[]> {
  const out: Record<string, PermissionDef[]> = {};
  for (const p of perms) (out[p.category] ||= []).push(p);
  return out;
}

export function roleScope(r: RoleWithMeta): 'system' | 'global' | 'org' {
  if (r.isSystem) return 'system';
  if (r.isGlobal) return 'global';
  return 'org';
}
