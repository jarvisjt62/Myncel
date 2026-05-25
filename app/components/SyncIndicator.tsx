'use client';

/**
 * SyncIndicator
 * ─────────────
 * Floating pill that shows the current offline-sync state. Tapping it
 * opens a modal drawer with the per-mutation queue, "Retry now" and
 * per-item "Discard" controls.
 *
 * Visual states (in priority order):
 *   1. Offline           → amber pill   "● Offline (N)"
 *   2. Failed item       → red pill     "! Sync failed"
 *   3. Syncing           → blue pill    "⟳ Syncing N…"
 *   4. Online + N pending→ blue pill    "↻ N pending"
 *   5. Online + 0 pending→ render nothing
 *
 * Styled with inline styles to match other Myncel modals (solid white,
 * subtle shadow) without depending on the global Tailwind config.
 */

import React, { useMemo, useState } from 'react';
import { useSync } from '@/lib/sync/SyncProvider';
import { MAX_ATTEMPTS } from '@/lib/sync/processor';

function formatRelative(iso: string | null): string {
  if (!iso) return 'never';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'never';
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

export default function SyncIndicator() {
  const {
    connectivity,
    pending,
    isSyncing,
    lastSyncedAt,
    lastError,
    retryNow,
    discardMutation,
  } = useSync();

  const [open, setOpen] = useState(false);

  const failedCount = useMemo(
    () => pending.filter((m) => m.attemptCount >= MAX_ATTEMPTS).length,
    [pending]
  );

  // Decide what (if anything) to render.
  const offline = connectivity === 'offline';
  const hasPending = pending.length > 0;

  if (!offline && !hasPending && !lastError) return null;

  // Determine pill appearance.
  let bg = '#2563eb'; // blue (pending / syncing)
  let label = '';
  let icon = '↻';
  if (offline) {
    bg = '#d97706'; // amber-600
    icon = '●';
    label = `Offline${hasPending ? ` (${pending.length})` : ''}`;
  } else if (failedCount > 0) {
    bg = '#dc2626'; // red-600
    icon = '!';
    label = `Sync failed${failedCount > 1 ? ` (${failedCount})` : ''}`;
  } else if (isSyncing) {
    icon = '⟳';
    label = `Syncing${hasPending ? ` ${pending.length}…` : '…'}`;
  } else if (hasPending) {
    icon = '↻';
    label = `${pending.length} pending`;
  } else {
    // online, no pending, but a stale lastError — keep it minimal.
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Sync status: ${label}`}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 50,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: 9999,
          background: bg,
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          border: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          cursor: 'pointer',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            transform: isSyncing ? 'rotate(0deg)' : 'none',
            animation: isSyncing ? 'myncel-spin 1s linear infinite' : 'none',
          }}
        >
          {icon}
        </span>
        <span>{label}</span>
      </button>

      {/* Spinner keyframes (scoped via a style tag — no global CSS edit). */}
      <style>{`
        @keyframes myncel-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sync status"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              margin: 16,
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                  Sync status
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {connectivity === 'online'
                    ? 'Online'
                    : connectivity === 'offline'
                    ? 'Offline — changes are saved locally'
                    : 'Checking connection…'}
                  {' · '}Last sync: {formatRelative(lastSyncedAt)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 22,
                  lineHeight: 1,
                  color: '#475569',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>

            {/* Summary row */}
            <div
              style={{
                padding: '12px 18px',
                background: '#f8fafc',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                gap: 18,
                fontSize: 13,
                color: '#334155',
              }}
            >
              <div>
                <strong style={{ color: '#0f172a' }}>{pending.length}</strong>{' '}
                pending
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>{failedCount}</strong>{' '}
                failed
              </div>
              {lastError && (
                <div style={{ color: '#b91c1c', flex: 1, textAlign: 'right' }}>
                  {lastError}
                </div>
              )}
            </div>

            {/* Pending list */}
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {pending.length === 0 ? (
                <div
                  style={{
                    padding: '28px 18px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: 14,
                  }}
                >
                  All changes are synced. ✅
                </div>
              ) : (
                pending.map((m) => {
                  const failed = m.attemptCount >= MAX_ATTEMPTS;
                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '12px 18px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {m.label}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: failed ? '#b91c1c' : '#64748b',
                            marginTop: 2,
                          }}
                        >
                          {failed
                            ? `Failed after ${m.attemptCount} attempts${
                                m.lastError ? ` — ${m.lastError}` : ''
                              }`
                            : `Queued ${formatRelative(m.createdAt)}${
                                m.attemptCount > 0
                                  ? ` · ${m.attemptCount} attempt${
                                      m.attemptCount === 1 ? '' : 's'
                                    }`
                                  : ''
                              }`}
                        </div>
                      </div>
                      {failed && (
                        <button
                          type="button"
                          onClick={() => discardMutation(m.id)}
                          style={{
                            border: '1px solid #fecaca',
                            background: '#fff',
                            color: '#b91c1c',
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '6px 10px',
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                        >
                          Discard
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  color: '#334155',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSyncing || pending.length === 0}
                onClick={() => {
                  retryNow();
                }}
                style={{
                  border: 'none',
                  background:
                    isSyncing || pending.length === 0 ? '#94a3b8' : '#2563eb',
                  color: '#fff',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor:
                    isSyncing || pending.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {isSyncing ? 'Syncing…' : 'Retry now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
