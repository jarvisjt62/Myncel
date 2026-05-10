import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UserSidebar from './UserSidebar';
import MaintenanceGate from './MaintenanceGate';

export default async function UserShellLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/signin');

  const userRole = session.user.role ?? 'MEMBER';

  return (
    <MaintenanceGate userRole={userRole}>
      <UserSidebar
        user={{
          name: session.user.name ?? 'User',
          email: session.user.email ?? '',
          role: userRole,
          organizationName: session.user.organizationName ?? 'Your Organization',
        }}
      >
        {children}
      </UserSidebar>
    </MaintenanceGate>
  );
}