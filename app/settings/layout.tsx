import UserShellLayout from '@/app/components/UserShellLayout';
import SettingsShell from './SettingsShell';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserShellLayout>
      <SettingsShell>
        {children}
      </SettingsShell>
    </UserShellLayout>
  );
}