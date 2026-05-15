import type { Metadata } from 'next';
import UserShellLayout from '@/app/components/UserShellLayout';

// Suppress Open Graph / Twitter card metadata for the dashboard area so that
// SMS, iMessage, WhatsApp and other link-preview crawlers do not render the
// Myncel logo card beneath links to /dashboard. The dashboard is auth-walled
// and not meant to generate public previews anyway.
export const metadata: Metadata = {
  title: 'Dashboard',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  openGraph: {
    images: [],
    title: '',
    description: '',
    siteName: '',
  },
  twitter: {
    card: 'summary',
    title: '',
    description: '',
    images: [],
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <UserShellLayout>{children}</UserShellLayout>;
}
