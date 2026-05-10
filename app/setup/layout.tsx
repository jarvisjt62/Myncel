import UserShellLayout from '@/app/components/UserShellLayout';

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <UserShellLayout>{children}</UserShellLayout>;
}