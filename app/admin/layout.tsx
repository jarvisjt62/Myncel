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
        { href: '/dashboard/iot-simulator', label: 'IoT Simulator',  icon: '🔬' , external: true },
        { href: '/equipment/qr-labels',     label: 'QR Labels',      icon: '📱' , external: true },
        { href: '/docs/api',                label: 'API Docs',        icon: '📖' , external: true },
        { href: '/settings/api-keys',       label: 'API Keys',        icon: '🔑' , external: true },
        { href: '/setup',                   label: 'Setup Wizard',    icon: '⚡' , external: true },
        { href: '/docs/iot-guides',         label: 'Wiring Guides',   icon: '🔧' , external: true },
        { href: '/docs/protocols',          label: 'Protocols',       icon: '📡' , external: true },
      ],
    },
    {
      label: 'Account',
      items: [
        { href: '/admin/account',   label: 'My Account', icon: '👤' },
        { href: '/admin/settings',  label: 'Settings',   icon: '⚙️' },
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