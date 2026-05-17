'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import NotificationsBootstrap from './NotificationsBootstrap';
import CapacitorSplashHide from './CapacitorSplashHide';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <CapacitorSplashHide />
      <NotificationsBootstrap />
      {children}
    </SessionProvider>
  );
}
