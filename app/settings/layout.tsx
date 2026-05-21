import UserShellLayout from '@/app/components/UserShellLayout';
import SettingsShell from './SettingsShell';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || null;

  return (
    <UserShellLayout>
      <SettingsShell userRole={userRole}>
        {children}
      </SettingsShell>
    </UserShellLayout>
  );
}
