/**
 * Seeds the permission catalog + the 6 system roles (OWNER, ADMIN,
 * TECHNICIAN, OPERATOR, EMPLOYEE, MEMBER) with sensible default permissions.
 *
 * Idempotent — safe to run repeatedly. Uses upsert on permission.key and
 * role.slug so re-runs only ADD missing rows and never destroy custom roles.
 *
 * Run: npx tsx prisma/seed-permissions.ts
 * or : npm run seed:permissions   (if a script is added)
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

type PermissionSeed = {
  key: string;
  category: string;
  label: string;
  description?: string;
};

// ---------------------------------------------------------------------------
// 1. PERMISSION CATALOG
// ---------------------------------------------------------------------------
const PERMISSIONS: PermissionSeed[] = [
  // Work Orders
  { key: 'work_orders.view',   category: 'Work Orders', label: 'View work orders' },
  { key: 'work_orders.create', category: 'Work Orders', label: 'Create work orders' },
  { key: 'work_orders.edit',   category: 'Work Orders', label: 'Edit work orders' },
  { key: 'work_orders.delete', category: 'Work Orders', label: 'Delete work orders' },
  { key: 'work_orders.assign', category: 'Work Orders', label: 'Assign work orders to technicians' },
  { key: 'work_orders.close',  category: 'Work Orders', label: 'Close / complete work orders' },
  { key: 'work_orders.export', category: 'Work Orders', label: 'Export work orders' },

  // Machines
  { key: 'machines.view',   category: 'Machines', label: 'View machines' },
  { key: 'machines.create', category: 'Machines', label: 'Add new machines' },
  { key: 'machines.edit',   category: 'Machines', label: 'Edit machines' },
  { key: 'machines.delete', category: 'Machines', label: 'Delete machines' },
  { key: 'machines.export', category: 'Machines', label: 'Export machine data' },

  // Parts Inventory
  { key: 'parts.view',        category: 'Parts Inventory', label: 'View parts inventory' },
  { key: 'parts.create',      category: 'Parts Inventory', label: 'Add new parts' },
  { key: 'parts.edit',        category: 'Parts Inventory', label: 'Edit parts' },
  { key: 'parts.delete',      category: 'Parts Inventory', label: 'Delete parts' },
  { key: 'parts.adjust_stock',category: 'Parts Inventory', label: 'Adjust stock levels' },
  { key: 'parts.export',      category: 'Parts Inventory', label: 'Export inventory' },

  // Schedules / Maintenance Tasks
  { key: 'schedules.view',     category: 'Schedules', label: 'View maintenance schedules' },
  { key: 'schedules.create',   category: 'Schedules', label: 'Create scheduled tasks' },
  { key: 'schedules.edit',     category: 'Schedules', label: 'Edit scheduled tasks' },
  { key: 'schedules.delete',   category: 'Schedules', label: 'Delete scheduled tasks' },
  { key: 'schedules.complete', category: 'Schedules', label: 'Mark tasks complete' },

  // Team
  { key: 'team.view',        category: 'Team',  label: 'View team members' },
  { key: 'team.invite',      category: 'Team',  label: 'Invite new team members' },
  { key: 'team.edit_roles',  category: 'Team',  label: 'Assign / change member roles' },
  { key: 'team.remove',      category: 'Team',  label: 'Remove team members' },

  // Roles & Permissions
  { key: 'roles.view',   category: 'Roles & Permissions', label: 'View roles and permissions' },
  { key: 'roles.create', category: 'Roles & Permissions', label: 'Create custom roles' },
  { key: 'roles.edit',   category: 'Roles & Permissions', label: 'Edit custom roles' },
  { key: 'roles.delete', category: 'Roles & Permissions', label: 'Delete custom roles' },

  // Reports
  { key: 'reports.view',   category: 'Reports', label: 'View reports' },
  { key: 'reports.export', category: 'Reports', label: 'Export reports' },

  // Alerts
  { key: 'alerts.view',        category: 'Alerts', label: 'View alerts' },
  { key: 'alerts.create',      category: 'Alerts', label: 'Create alerts' },
  { key: 'alerts.acknowledge', category: 'Alerts', label: 'Acknowledge alerts' },
  { key: 'alerts.resolve',     category: 'Alerts', label: 'Resolve alerts' },
  { key: 'alerts.edit',        category: 'Alerts', label: 'Edit alerts' },
  { key: 'alerts.delete',      category: 'Alerts', label: 'Delete alerts' },

  // Billing
  { key: 'billing.view',   category: 'Billing', label: 'View billing information' },
  { key: 'billing.manage', category: 'Billing', label: 'Manage subscriptions & payment methods' },

  // Integrations & Webhooks
  { key: 'integrations.view',      category: 'Integrations & Webhooks', label: 'View integrations' },
  { key: 'integrations.configure', category: 'Integrations & Webhooks', label: 'Configure integrations & webhooks' },

  // Settings
  { key: 'settings.view', category: 'Settings', label: 'View organization settings' },
  { key: 'settings.edit', category: 'Settings', label: 'Edit organization settings' },
];

// ---------------------------------------------------------------------------
// 2. SYSTEM ROLES (mirror existing UserRole enum)
// ---------------------------------------------------------------------------
type SystemRole = {
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  permissionKeys: string[] | 'ALL';
};

const ALL: 'ALL' = 'ALL';

const SYSTEM_ROLES: SystemRole[] = [
  {
    slug: 'owner',
    name: 'Owner',
    description: 'Full access to everything including billing and organization settings.',
    color: '#7c3aed',
    icon: '👑',
    permissionKeys: ALL,
  },
  {
    slug: 'admin',
    name: 'Admin',
    description: 'Manage team, machines, parts & work orders. Cannot manage billing.',
    color: '#635bff',
    icon: '🛡️',
    permissionKeys: [
      'work_orders.view','work_orders.create','work_orders.edit','work_orders.delete','work_orders.assign','work_orders.close','work_orders.export',
      'machines.view','machines.create','machines.edit','machines.delete','machines.export',
      'parts.view','parts.create','parts.edit','parts.delete','parts.adjust_stock','parts.export',
      'schedules.view','schedules.create','schedules.edit','schedules.delete','schedules.complete',
      'team.view','team.invite','team.edit_roles','team.remove',
      'roles.view','roles.create','roles.edit','roles.delete',
      'reports.view','reports.export',
      'alerts.view','alerts.create','alerts.acknowledge','alerts.resolve','alerts.edit','alerts.delete',
      'integrations.view','integrations.configure',
      'settings.view','settings.edit',
    ],
  },
  {
    slug: 'technician',
    name: 'Technician',
    description: 'Diagnose faults, complete repairs & maintenance work orders.',
    color: '#10b981',
    icon: '🔧',
    permissionKeys: [
      'work_orders.view','work_orders.create','work_orders.edit','work_orders.close','work_orders.export',
      'machines.view','machines.edit',
      'parts.view','parts.adjust_stock',
      'schedules.view','schedules.complete',
      'team.view',
      'reports.view',
      'alerts.view','alerts.acknowledge','alerts.resolve',
    ],
  },
  {
    slug: 'operator',
    name: 'Operator',
    description: 'Run assigned machines, monitor HMI status & report issues.',
    color: '#f59e0b',
    icon: '🏭',
    permissionKeys: [
      'work_orders.view','work_orders.create',
      'machines.view',
      'parts.view',
      'schedules.view',
      'team.view',
      'alerts.view','alerts.acknowledge',
    ],
  },
  {
    slug: 'employee',
    name: 'Employee',
    description: 'Submit requests, view assigned tasks & follow safety checklists.',
    color: '#3b82f6',
    icon: '👤',
    permissionKeys: [
      'work_orders.view','work_orders.create',
      'machines.view',
      'parts.view',
      'schedules.view','schedules.complete',
      'team.view',
      'alerts.view',
    ],
  },
  {
    slug: 'member',
    name: 'Member',
    description: 'View dashboards, reports & shared maintenance updates (read-only).',
    color: '#6b7280',
    icon: '👁️',
    permissionKeys: [
      'work_orders.view',
      'machines.view',
      'parts.view',
      'schedules.view',
      'team.view',
      'reports.view',
      'alerts.view',
    ],
  },
];

// ---------------------------------------------------------------------------
async function main() {
  console.log('🌱 Seeding permission catalog...');
  for (const p of PERMISSIONS) {
    await db.permission.upsert({
      where: { key: p.key },
      update: { category: p.category, label: p.label, description: p.description },
      create: { key: p.key, category: p.category, label: p.label, description: p.description, isCustom: false },
    });
  }
  const totalPerms = await db.permission.count();
  console.log(`   ✔  ${PERMISSIONS.length} permissions upserted (catalog total: ${totalPerms})`);

  console.log('🌱 Seeding system roles...');
  const allPerms = await db.permission.findMany({ select: { id: true, key: true } });
  const keyToId = new Map(allPerms.map(p => [p.key, p.id] as const));

  for (const r of SYSTEM_ROLES) {
    // System roles are NOT scoped to an org (organizationId = null) and are isSystem=true
    // We key them by slug with organizationId=null via a findFirst + create/update pattern
    // because the @@unique is on (organizationId, slug) and Prisma can't upsert on a
    // compound key that includes a nullable column.
    const existing = await db.role.findFirst({
      where: { slug: r.slug, organizationId: null, isSystem: true },
    });

    const role = existing
      ? await db.role.update({
          where: { id: existing.id },
          data: {
            name: r.name,
            description: r.description,
            color: r.color,
            icon: r.icon,
            isSystem: true,
            isGlobal: false,
          },
        })
      : await db.role.create({
          data: {
            slug: r.slug,
            name: r.name,
            description: r.description,
            color: r.color,
            icon: r.icon,
            isSystem: true,
            isGlobal: false,
          },
        });

    // Resolve permission ids
    const permIds =
      r.permissionKeys === ALL
        ? Array.from(keyToId.values())
        : r.permissionKeys.map(k => keyToId.get(k)).filter((x): x is string => !!x);

    // Remove any stale links, then insert the canonical set. This keeps system-role
    // permissions authoritative on every run.
    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permIds.length > 0) {
      await db.rolePermission.createMany({
        data: permIds.map(permissionId => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
    console.log(`   ✔  ${r.icon} ${r.name.padEnd(10)}  →  ${permIds.length} permissions`);
  }

  console.log('✅ Roles & permissions seed complete.');
}

main()
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
