'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import NotificationsBootstrap from './NotificationsBootstrap';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <NotificationsBootstrap />
      {children}
    </SessionProvider>
  );
}
