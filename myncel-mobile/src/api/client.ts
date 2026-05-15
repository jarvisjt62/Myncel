/**
 * Centralized Axios client with:
 *  - Base URL from app.json extra config
 *  - Automatic JWT bearer token injection
 *  - 401 handling that triggers sign-out
 *  - Network error normalization
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'https://www.myncel.com';

export const TOKEN_KEY = 'myncel.auth.token';
export const REFRESH_KEY = 'myncel.auth.refresh';

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string; message?: string }>) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      onUnauthorized?.();
    }
    // Normalize errors so screens get a consistent shape.
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Network error';
    return Promise.reject(new Error(message));
  }
);

export const apiBaseUrl = API_BASE_URL;
