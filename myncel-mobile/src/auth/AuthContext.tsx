import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '@/api/endpoints';
import { TOKEN_KEY, REFRESH_KEY, setUnauthorizedHandler } from '@/api/client';
import type { CurrentUser } from '@/api/types';

type AuthState = {
  isLoading: boolean;        // true while we're rehydrating from secure storage
  isAuthenticated: boolean;
  user: CurrentUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate auth state on app launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) {
          if (!cancelled) setIsLoading(false);
          return;
        }
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        // Token invalid/expired — purge it.
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
        await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const signOut = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore network errors on logout */ }
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
    setUser(null);
  }, []);

  // When the API client gets a 401, force a sign-out.
  useEffect(() => {
    setUnauthorizedHandler(() => { setUser(null); });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email.trim(), password);
    await SecureStore.setItemAsync(TOKEN_KEY, res.token);
    if (res.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);
    }
    setUser(res.user);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      await signOut();
    }
  }, [signOut]);

  const value = useMemo<AuthState>(() => ({
    isLoading,
    isAuthenticated: user != null,
    user,
    signIn,
    signOut,
    refresh,
  }), [isLoading, user, signIn, signOut, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
