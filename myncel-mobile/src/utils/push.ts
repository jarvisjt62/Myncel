/**
 * Push notifications setup using expo-notifications.
 * Registers the device for push, gets the Expo push token, and sends it to the
 * Myncel backend for storage. The backend then uses the Expo Push API to send
 * notifications when alerts/work orders/etc. are created.
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { authApi } from '@/api/endpoints';

// Foreground notification handler — show banner + play sound
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Myncel Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#635bff',
      sound: 'default',
    });
  }

  if (!Device.isDevice) {
    // Push notifications don't work on simulators — silently skip.
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.warn('[push] No EAS projectId — skipping push token registration.');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (err) {
    console.warn('[push] Failed to fetch Expo push token', err);
    return null;
  }
}

/** Register the push token with the Myncel backend so it can push alerts. */
export async function syncPushTokenWithBackend(): Promise<void> {
  const token = await registerForPushNotificationsAsync();
  if (!token) return;
  try {
    await authApi.registerPushToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
  } catch (err) {
    console.warn('[push] Failed to register token with backend', err);
  }
}
