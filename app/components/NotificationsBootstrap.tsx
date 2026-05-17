'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { initNativeNotifications } from '@/lib/native-notifications';

/**
 * Mounted once globally. After the user is authenticated it bootstraps
 * native (Capacitor) push + local notifications and registers the device
 * token with the server. Safe on the desktop web build — falls back to a
 * no-op for environments without Capacitor.
 */
export default function NotificationsBootstrap() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return;
    initNativeNotifications().catch(err =>
      console.warn('[NotificationsBootstrap] init failed:', err)
    );
  }, [status]);

  return null;
}
