import UserShellLayout from '@/app/components/UserShellLayout';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <UserShellLayout>{children}</UserShellLayout>;
}