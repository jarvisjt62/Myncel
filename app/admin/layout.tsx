import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayoutClient from './AdminLayoutClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Dashboard — Myncel',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect('/signin?callbackUrl=/admin');
  if (session.user.email !== 'admin@myncel.com') redirect('/dashboard');

  const navSections = [
    {
      label: 'Platform',
      items: [
        { href: '/admin',               label: 'Overview',       icon: '📊', exact: true },
        { href: '/admin/users',         label: 'Users',          icon: '👥' },
        { href: '/admin/organizations', label: 'Organizations',  icon: '🏢' },
        { href: '/admin/machines',      label: 'Machines',       icon: '⚙️' },
        { href: '/admin/work-orders',   label: 'Work Orders',    icon: '📋' },
        { href: '/admin/alerts',        label: 'Alerts',         icon: '🔔' },
        { href: '/admin/chat',          label: 'Live Chat',      icon: '💬' },
        { href: '/admin/hmi',           label: 'HMI Monitor',    icon: '🖥️' },
        { href: '/admin/test-panel',    label: 'Test Panel',     icon: '🧪' },
      ],
    },
    {
      label: 'IoT & Integration',
      items: [
        { href: '/admin/iot-simulator',   label: 'IoT Simulator',  icon: '🔬' },
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