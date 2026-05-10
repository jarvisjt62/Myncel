'use client';

/**
 * Reusable loading skeleton components for settings pages.
 * Replaces plain "Loading..." text with animated placeholder shapes.
 */

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-24 h-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="w-10 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="w-20 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 flex items-center gap-4" style={{ borderBottom: i < rows - 1 ? '1px solid var(--border)' : undefined }}>
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-32 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-48 h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <div className="w-16 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-16 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function IntegrationCardSkeleton() {
  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="space-y-2">
            <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-48 h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
        <div className="w-20 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-40 h-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-24 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="flex items-center justify-between py-3">
              <div className="space-y-2">
                <div className="w-32 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="w-48 h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
              <div className="w-11 h-6 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="w-32 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      {/* Title */}
      <div className="space-y-2">
        <div className="w-64 h-7 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="w-96 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
      {/* Content cards */}
      <CardSkeleton rows={3} />
    </div>
  );
}