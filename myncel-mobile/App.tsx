/**
 * Myncel mobile app — root component.
 * Wraps the navigation tree with all required context providers.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import { AuthProvider } from '@/auth/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';

// Keep the splash screen visible until we've finished loading auth state.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  useEffect(() => {
    // Hide splash screen once the JS bundle is loaded.
    SplashScreen.hideAsync().catch(() => {});

    // When a user taps a push notification with a `link` data field,
    // open that URL inside the app (deep link) or fall back to web.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const link = response.notification.request.content.data?.link as string | undefined;
      if (link) Linking.openURL(link).catch(() => {});
    });

    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
