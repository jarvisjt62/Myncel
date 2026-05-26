'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import NotificationsBootstrap from './NotificationsBootstrap';
import CapacitorSplashHide from './CapacitorSplashHide';
import SyncIndicator from './SyncIndicator';
import { SyncProvider } from '@/lib/sync/SyncProvider';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {/* Hides the NATIVE Capacitor splash screen after a minimum
          visible duration. We rely entirely on the native splash
          (configured in the Capacitor shell with the user-supplied
          splash.png) to avoid the dual-splash glitch users were
          seeing on app launch — and the secondary flash that would
          re-trigger after navigations because the in-WebView HTML
          overlay was re-mounting on every layout re-render. */}
      <CapacitorSplashHide />
      <NotificationsBootstrap />
      {/* Offline-aware mutation queue. Wraps the whole app so any
          page (web or Capacitor WebView) can call useSync() and queue
          API writes when the device is offline. */}
      <SyncProvider>
        {children}
        {/* Floating pill in the bottom-right that surfaces queue state. */}
        <SyncIndicator />
      </SyncProvider>
    </SessionProvider>
  );
}
