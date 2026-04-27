import UserShellLayout from '@/app/components/UserShellLayout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <UserShellLayout>{children}</UserShellLayout>;
}