import UserShellLayout from '@/app/components/UserShellLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <UserShellLayout>{children}</UserShellLayout>;
}
