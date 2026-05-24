'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import NotificationsBootstrap from './NotificationsBootstrap';
import CapacitorSplashHide from './CapacitorSplashHide';
import MobileSplashOverlay from './MobileSplashOverlay';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {/* Hides the NATIVE splash (capacitor plugin). Behaviour varies
          by vendor (Samsung One UI overrides launch theme), so we ALSO
          render an in-WebView overlay below for consistency. */}
      <CapacitorSplashHide />
      {/* Branded splash rendered in HTML. Only visible inside the
          Capacitor mobile app. Guaranteed 2s minimum on every device. */}
      <MobileSplashOverlay />
      <NotificationsBootstrap />
      {children}
    </SessionProvider>
  );
}
