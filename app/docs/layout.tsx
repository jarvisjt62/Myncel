import UserShellLayout from '@/app/components/UserShellLayout';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <UserShellLayout>{children}</UserShellLayout>;
}