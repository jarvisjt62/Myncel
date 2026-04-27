'use client';

import { useEffect, useState } from 'react';

interface Activity {
  id: string;
  type: 'work_order' | 'alert' | 'maintenance' | 'status_change';
  title: string;
  description: string;
  machineName?: string;
  timestamp: string;
  priority?: string;
  status?: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const response = await fetch('/api/dashboard/activity');
        if (!response.ok) throw new Error('Failed to fetch activities');
        const data = await response.json();
        setActivities(data.activities || []);
      } catch (err) {
        setError('Unable to load activities');
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'work_order':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'alert':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'maintenance':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getActivityColor = (type: string, priority?: string) => {
    if (type === 'alert') {
      if (priority === 'critical') return 'bg-red-500/10 text-red-500 border-red-500/20';
      if (priority === 'high') return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    }
    if (type === 'work_order') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (type === 'maintenance') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
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
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-5">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface-2)]"></div>
              <div className="flex-1">
                <div className="h-4 bg-[var(--bg-surface-2)] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[var(--bg-surface-2)] rounded w-1/2"></div>
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
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Recent Activity
        </h3>
        <p className="text-[var(--text-muted)] text-center py-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-5">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Recent Activity
      </h3>
      
      {activities.length === 0 ? (
        <p className="text-[var(--text-muted)] text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex gap-3 p-3 rounded-lg border transition-all hover:scale-[1.01] ${getActivityColor(activity.type, activity.priority)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] text-sm font-medium truncate">{activity.title}</p>
                <p className="text-[var(--text-secondary)] text-xs mt-0.5 truncate">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {activity.machineName && (
                    <span className="text-xs text-[#635bff] bg-[#635bff]/10 px-2 py-0.5 rounded">
                      {activity.machineName}
                    </span>
                  )}
                  <span className="text-xs text-[var(--text-muted)]">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}