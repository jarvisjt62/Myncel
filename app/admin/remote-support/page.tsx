import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import AdminRemoteSupportClient from './AdminRemoteSupportClient';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Remote Support — Admin' };
export default async function AdminRemoteSupportPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') redirect('/signin');
  const [sessions, organizations, machines] = await Promise.all([
    db.remoteSupportSession.findMany({ orderBy: { createdAt: 'desc' }, include: { organization: { select: { name: true } }, machine: { select: { name: true, model: true } }, workOrder: { select: { woNumber: true, title: true } }, createdBy: { select: { name: true, email: true } }, participants: { select: { displayName: true, role: true, joinedAt: true, leftAt: true } }, _count: { select: { auditLogs: true } } } }).catch(() => []),
    db.organization.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }).catch(() => []),
    db.machine.findMany({ select: { id: true, name: true, organizationId: true }, orderBy: { name: 'asc' } }).catch(() => []),
  ]);
  return <AdminRemoteSupportClient initialSessions={sessions as any} orgs={organizations} machines={machines} />;
}
