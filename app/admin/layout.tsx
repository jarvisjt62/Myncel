import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayoutClient from './AdminLayoutClient';
import { db } from '@/lib/db';
import { safeQuery } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Dashboard — Myncel',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect('/signin?callbackUrl=/admin');
  if (session.user.email !== 'admin@myncel.com') redirect('/dashboard');

  const [unreadFormSubmissions, unreadChatMessages, activeChatSessions] = await Promise.all([
    safeQuery(
      db.formSubmission.count({ where: { isRead: false } }),
      0
    ),
    safeQuery(
      db.chatMessage.count({
        where: {
          senderType: 'USER',
          isRead: false,
          session: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        },
      }),
      0
    ),
    safeQuery(
      db.chatSession.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      0
    ),
  ]);

  const formSubmissionBadge = unreadFormSubmissions && unreadFormSubmissions > 0
    ? String(unreadFormSubmissions)
    : undefined;

  const liveChatBadge = unreadChatMessages && unreadChatMessages > 0
    ? String(unreadChatMessages)
    : activeChatSessions && activeChatSessions > 0
      ? String(activeChatSessions)
      : undefined;

  const navSections = [
    {
      label: 'Platform',
      items: [
        { href: '/admin',               label: 'Overview',       icon: '📊', exact: true },
        { href: '/admin/form-submissions', label: 'Form Submissions', icon: '📨', badge: formSubmissionBadge },
        { href: '/admin/users',         label: 'Users',          icon: '👥' },
        { href: '/admin/roles',         label: 'Roles',          icon: '🛡️' },
        { href: '/admin/permissions',   label: 'Permissions',    icon: '🔐' },
        { href: '/admin/organizations', label: 'Organizations',  icon: '🏢' },
        { href: '/admin/machines',      label: 'Machines',       icon: '⚙️' },
        { href: '/admin/work-orders',   label: 'Work Orders',    icon: '📋' },
        { href: '/admin/schedules',     label: 'Schedules',      icon: '📅' },
        { href: '/admin/alerts',        label: 'Alerts',         icon: '🔔' },
        { href: '/admin/emergency',     label: 'Emergency Broadcast', icon: '🚨' },
        { href: '/admin/push-debug',    label: 'Push Debug',     icon: '📡' },
        { href: '/admin/ai-chat-log',   label: 'AI Chat Log',    icon: '🧠' },
        { href: '/admin/reports',       label: 'Reports',         icon: '📈' },
        { href: '/admin/parts',         label: 'Parts Inventory',icon: '🔧' },
        { href: '/admin/chat',          label: 'Live Chat',      icon: '💬', badge: liveChatBadge },
        { href: '/admin/remote-support', label: 'Remote Support',  icon: '📡' },
        { href: '/admin/hmi',           label: 'HMI Monitor',    icon: '🖥️' },
        { href: '/admin/test-panel',    label: 'Test Panel',     icon: '🧪' },
      ],
    },
    {
      label: 'IoT & Integration',
      items: [
        { href: '/admin/iot-simulator',   label: 'IoT Simulator',  icon: '🔬' },
        { href: '/admin/edge-gateway',    label: 'Gateway Services', icon: '🌐' },
        { href: '/admin/qr-labels',       label: 'QR Labels',      icon: '📱' },
        { href: '/admin/docs/api',        label: 'API Docs',        icon: '📖' },
        { href: '/admin/api-keys',        label: 'API Keys',        icon: '🔑' },
        { href: '/admin/setup-wizard',    label: 'Setup Wizard',    icon: '⚡' },
        { href: '/admin/docs/iot-guides', label: 'Wiring Guides',   icon: '🔧' },
        { href: '/admin/docs/protocols',  label: 'Protocols',       icon: '📡' },
      ],
    },
    {
      label: 'Billing',
      items: [
        { href: '/admin/billing', label: 'Billing Overview', icon: '💳' },
      ],
    },
    {
      label: 'Account',
      items: [
        { href: '/admin/account',          label: 'My Account',       icon: '👤' },
        { href: '/admin/settings',         label: 'Settings',         icon: '⚙️' },
        { href: '/admin/settings/platform',label: 'Platform Config',  icon: '🔧' },
      ],
    },
  ];

  const externalLinks = [
    { href: 'https://vercel.com',   label: 'Vercel',   icon: '▲' },
    { href: 'https://supabase.com', label: 'Supabase', icon: '⚡' },
    { href: 'https://resend.com',   label: 'Resend',   icon: '📧' },
  ];

  return (
    <AdminLayoutClient
      navSections={navSections}
      externalLinks={externalLinks}
      userName={session.user.name ?? 'A'}
    >
      {children}
    </AdminLayoutClient>
  );
}