'use client';

import { useEffect, useState } from 'react';

interface Activity {
  id: string;
  type: 'work_order' | 'alert' | 'maintenance' | 'status_change';
  action: string;
  title: string;
  description: string;
  machineName?: string;
  timestamp: string;
  priority?: string;
  status?: string;
  user?: string | null;
  metadata?: Record<string, any>;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/dashboard/activity');
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data.activities || []);
    } catch {
      setError('Unable to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'work_order':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'alert':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'maintenance':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getActivityColors = (type: string, priority?: string) => {
    if (type === 'alert') {
      if (priority === 'CRITICAL') return { dot: 'bg-red-500', icon: 'bg-red-500/10 text-red-500' };
      if (priority === 'HIGH') return { dot: 'bg-orange-500', icon: 'bg-orange-500/10 text-orange-500' };
      return { dot: 'bg-yellow-500', icon: 'bg-yellow-500/10 text-yellow-600' };
    }
    if (type === 'work_order') return { dot: 'bg-blue-500', icon: 'bg-blue-500/10 text-blue-500' };
    if (type === 'maintenance') return { dot: 'bg-emerald-500', icon: 'bg-emerald-500/10 text-emerald-600' };
    return { dot: 'bg-gray-400', icon: 'bg-gray-500/10 text-gray-500' };
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActionLabel = (type: string, action: string) => {
    const labels: Record<string, string> = {
      'work_order-completed': 'Completed',
      'work_order-started': 'In Progress',
      'work_order-created': 'Created',
      'alert-triggered': 'Alert',
      'alert-resolved': 'Resolved',
      'maintenance-completed': 'Done',
    };
    return labels[`${type}-${action}`] || action;
  };

  if (loading) {
    return (
      <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Activity Feed
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-2)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="h-3.5 bg-[var(--bg-surface-2)] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[var(--bg-surface-2)] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Activity Feed
        </h3>
        <p className="text-[var(--text-muted)] text-center py-4 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <svg className="w-4 h-4 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Activity Feed
        </h3>
        <span className="text-xs text-[var(--text-muted)]">Live</span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[var(--text-muted)] text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-3.5 top-4 bottom-4 w-px bg-[var(--border)]" />
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {activities.map((activity) => {
              const colors = getActivityColors(activity.type, activity.priority);
              return (
                <div key={activity.id} className="flex gap-3 items-start relative">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-7 h-7 rounded-full ${colors.icon} flex items-center justify-center flex-shrink-0 border border-[var(--border)]`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text-primary)] text-xs font-medium leading-snug truncate">
                          {activity.title}
                        </p>
                        {/* User attribution */}
                        {activity.user && (
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            <span className="font-medium text-[#635bff]">{activity.user}</span>
                            {' · '}{getActionLabel(activity.type, activity.action)}
                          </p>
                        )}
                        {!activity.user && activity.description && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{activity.description}</p>
                        )}
                        {activity.machineName && (
                          <span className="inline-block text-xs text-[#635bff] bg-[#635bff]/8 px-1.5 py-0.5 rounded mt-1">
                            {activity.machineName}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors.icon}`}>
                          {getActionLabel(activity.type, activity.action)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}