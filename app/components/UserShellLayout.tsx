import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UserSidebar from './UserSidebar';

export default async function UserShellLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/signin');

  return (
    <UserSidebar
      user={{
        name: session.user.name ?? 'User',
        email: session.user.email ?? '',
        role: session.user.role ?? 'MEMBER',
        organizationName: session.user.organizationName ?? 'Your Organization',
      }}
    >
      {children}
    </UserSidebar>
  );
}