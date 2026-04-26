import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { safeQuery, getSuperAdminOrgId } from '@/lib/admin-helpers';
import SettingsClient from './SettingsClient';

// Force dynamic rendering to avoid caching
export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const user = await safeQuery(
    db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    }),
    null
  );

  if (!user || !user.organizationId) {
    redirect('/admin');
  }

  // Detect if logged-in user is super admin (by org)
  const superAdminOrgId = await getSuperAdminOrgId();
  const isSuperAdmin = user.organization?.id === superAdminOrgId;

  // Super admin sees totals across ALL client orgs (excluding super admin org)
  // Regular admins see only their own org's data
  const orgFilter = isSuperAdmin && superAdminOrgId
    ? { organizationId: { not: superAdminOrgId } }
    : { organizationId: user.organizationId };

  const [machineCount, workOrderCount, alertCount, taskCount] = await Promise.all([
    safeQuery(db.machine.count({ where: orgFilter }), 0),
    safeQuery(db.workOrder.count({ where: orgFilter }), 0),
    safeQuery(db.alert.count({ where: orgFilter }), 0),
    safeQuery(db.maintenanceTask.count({ where: orgFilter }), 0),
  ]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <Link href="/admin" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>Admin</Link>
        <span style={{ color: 'var(--border-subtle)' }}>/</span>
        <span style={{ color: 'var(--text-primary)' }}>Settings</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your organization's data and appearance preferences.</p>
      </div>

      {/* Organization Info */}
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Organization Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Organization Name', value: user.organization?.name },
            { label: 'Plan', value: user.organization?.plan },
            { label: 'Industry', value: user.organization?.industry || 'Not specified' },
            { label: 'Your Role', value: user.role },
          ].map((item) => (
            <div key={item.label}>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</label>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Overview */}
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Data Overview</h2>
          {isSuperAdmin && (
            <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              All Organizations
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Machines', value: machineCount },
            { label: 'Work Orders', value: workOrderCount },
            { label: 'Alerts', value: alertCount },
            { label: 'Maintenance Tasks', value: taskCount },
          ].map((item) => (
            <div key={item.label} className="rounded-lg p-4" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance + Data Management (client component) */}
      <SettingsClient
        organizationId={user.organizationId}
        canCleanup={user.role === 'OWNER' || user.role === 'ADMIN'}
        hasData={machineCount > 0 || workOrderCount > 0 || alertCount > 0 || taskCount > 0}
      />
    </div>
  );
}