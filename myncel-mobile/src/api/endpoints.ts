/**
 * Typed API endpoint wrappers.
 *
 * The mobile app authenticates with a Bearer JWT (issued by /api/mobile/login)
 * and primarily talks to the dedicated /api/mobile/* endpoints which are
 * mobile-aware. Heavier write actions still fall back to the standard /api/*
 * endpoints for now.
 */

import { api } from './client';
import type {
  AuthLoginResponse,
  CurrentUser,
  Machine,
  WorkOrder,
  MaintenanceTask,
  Alert,
  Part,
  DashboardStats,
  Notification,
} from './types';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api
      .post<AuthLoginResponse>('/api/mobile/login', { email, password })
      .then((r) => r.data),

  me: () =>
    api.get<{ user: CurrentUser }>('/api/mobile/me').then((r) => r.data.user),

  registerPushToken: (
    token: string,
    platform: 'ios' | 'android',
    deviceName?: string,
    appVersion?: string
  ) =>
    api
      .post('/api/mobile/push-token', { token, platform, deviceName, appVersion })
      .then((r) => r.data),

  logout: (pushToken?: string) =>
    api.post('/api/mobile/logout', { pushToken }).then((r) => r.data),
};

// ─── Dashboard ──────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () =>
    api.get<DashboardStats>('/api/mobile/dashboard').then((r) => r.data),
};

// ─── Equipment / Machines ────────────────────────────────────────────────────
export const machinesApi = {
  list: () => api.get<Machine[]>('/api/mobile/machines').then((r) => r.data),
  get: (id: string) =>
    api.get<Machine>(`/api/mobile/machines/${id}`).then((r) => r.data),
};

// ─── Work Orders ────────────────────────────────────────────────────────────
export const workOrdersApi = {
  list: (opts: { status?: string; assignedToMe?: boolean } = {}) => {
    const params: Record<string, string> = {};
    if (opts.status) params.status = opts.status;
    if (opts.assignedToMe) params.assignedToMe = '1';
    return api
      .get<WorkOrder[]>('/api/mobile/work-orders', { params })
      .then((r) => r.data);
  },
  get: (id: string) =>
    api.get<WorkOrder>(`/api/mobile/work-orders/${id}`).then((r) => r.data),
  update: (
    id: string,
    data: { status?: WorkOrder['status']; completionNotes?: string; actualMinutes?: number }
  ) =>
    api
      .patch<WorkOrder>(`/api/mobile/work-orders/${id}`, data)
      .then((r) => r.data),
  updateStatus: (id: string, status: WorkOrder['status']) =>
    api
      .patch<WorkOrder>(`/api/mobile/work-orders/${id}`, { status })
      .then((r) => r.data),
};

// ─── Maintenance Schedules / Tasks ──────────────────────────────────────────
export const tasksApi = {
  list: () =>
    api
      .get<MaintenanceTask[]>('/api/mobile/maintenance-tasks')
      .then((r) => r.data),
};

// ─── Alerts ─────────────────────────────────────────────────────────────────
export const alertsApi = {
  list: (opts: { unread?: boolean } = {}) => {
    const params: Record<string, string> = {};
    if (opts.unread) params.unread = '1';
    return api
      .get<Alert[]>('/api/mobile/alerts', { params })
      .then((r) => r.data);
  },
  get: (id: string) =>
    api.get<Alert>(`/api/mobile/alerts/${id}`).then((r) => r.data),
  markRead: (id: string) =>
    api
      .patch<Alert>(`/api/mobile/alerts/${id}`, { isRead: true })
      .then((r) => r.data),
  resolve: (id: string) =>
    api
      .patch<Alert>(`/api/mobile/alerts/${id}`, { isResolved: true })
      .then((r) => r.data),
};

// ─── Parts (read-only on mobile, falls back to web endpoint) ────────────────
export const partsApi = {
  list: () => api.get<Part[]>('/api/parts').then((r) => r.data),
};

// ─── Notifications (uses web endpoint with bearer token) ────────────────────
export const notificationsApi = {
  list: () =>
    api
      .get<{ notifications: Notification[]; unreadCount: number }>(
        '/api/notifications'
      )
      .then((r) => r.data),
};
