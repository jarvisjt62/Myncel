import UserShellLayout from '@/app/components/UserShellLayout';

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return <UserShellLayout>{children}</UserShellLayout>;
}