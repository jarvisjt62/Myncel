'use client';

/**
 * VersionGate — client-side polling guard that keeps every browser /
 * Capacitor mobile app on the latest deploy.
 *
 * Behaviour:
 *   • On mount, fetches /api/version and remembers the response.
 *   • Re-checks every 60 s in the background.
 *   • Also re-checks immediately when the tab regains focus / the
 *     Capacitor app resumes from background.
 *   • If the server's appVersion differs from the value we remembered:
 *
 *       SMART RELOAD STRATEGY
 *       ─────────────────────
 *       1. Read-only screens (no dirty form, no in-flight uploads)
 *          → wipe caches and call window.location.reload() immediately.
 *
 *       2. Dirty screens (any element marked data-dirty="1", any form
 *          with unsaved changes, or any modal open)
 *          → render a non-blocking floating toast:
 *              "A new version is available — [Reload now]"
 *            User keeps working until they choose; we re-prompt every
 *            15 min if ignored, and force-reload once everything goes
 *            clean.
 *
 *   • Cache-clearing wipes:
 *       – sessionStorage entirely
 *       – localStorage keys we control (myncel.* prefix only)
 *       – every Cache Storage entry (PWA/service-worker caches)
 *
 * Mounted exactly once in app/layout.tsx so it runs everywhere.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

const POLL_INTERVAL_MS = 60_000; // 60 s
const REPROMPT_INTERVAL_MS = 15 * 60_000; // 15 min
const VERSION_KEY = 'myncel.appVersion';

function isDirty(): boolean {
  if (typeof document === 'undefined') return false;
  // Anything explicitly marked as dirty (e.g. unsaved form fields,
  // active uploads). Components opt-in by setting data-dirty="1".
  if (document.querySelector('[data-dirty="1"]')) return true;
  // Any open <dialog> or modal-style element with role="dialog"
  if (document.querySelector('dialog[open]')) return true;
  if (document.querySelector('[role="dialog"][aria-modal="true"]')) return true;
  // Heuristic: a form whose inputs have been modified beyond defaults.
  const forms = document.querySelectorAll('form');
  for (const f of Array.from(forms)) {
    const inputs = f.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      'input, textarea'
    );
    for (const el of Array.from(inputs)) {
      if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') continue;
      if (el.disabled || el.readOnly) continue;
      // textarea + most input types
      if ('defaultValue' in el && el.value !== el.defaultValue) return true;
    }
    const checks = f.querySelectorAll<HTMLInputElement>('input[type="checkbox"], input[type="radio"]');
    for (const el of Array.from(checks)) {
      if (el.checked !== el.defaultChecked) return true;
    }
  }
  return false;
}

async function clearAllCaches() {
  // 1) sessionStorage entirely
  try { sessionStorage.clear(); } catch {}
  // 2) only our own localStorage namespace (don't trash third-party libs)
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('myncel.')) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
  // 3) Cache Storage (PWA + service worker)
  if (typeof caches !== 'undefined' && caches?.keys) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {}
  }
  // 4) Tell the active service worker to skip waiting and unregister so
  //    the next reload pulls fresh JS from the network rather than a
  //    cached bundle.
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {}
  }
}

function hardReload() {
  // Cache-busting query so the WebView/CDN can't serve a stale HTML doc.
  const url = new URL(window.location.href);
  url.searchParams.set('_v', String(Date.now()));
  window.location.replace(url.toString());
}

export default function VersionGate() {
  const [pendingVersion, setPendingVersion] = useState<string | null>(null);
  const lastPromptAt = useRef<number>(0);
  const baselineVersion = useRef<string | null>(null);

  const check = useCallback(async () => {
    try {
      const r = await fetch('/api/version', { cache: 'no-store' });
      if (!r.ok) return;
      const { appVersion } = (await r.json()) as { appVersion: string };
      if (!appVersion) return;

      // First check — establish baseline.
      if (baselineVersion.current === null) {
        const stored = (() => {
          try { return localStorage.getItem(VERSION_KEY); } catch { return null; }
        })();
        if (stored && stored !== appVersion) {
          // We were offline / closed during a deploy. Treat as mismatch.
          baselineVersion.current = stored;
          setPendingVersion(appVersion);
          return;
        }
        baselineVersion.current = appVersion;
        try { localStorage.setItem(VERSION_KEY, appVersion); } catch {}
        return;
      }

      if (appVersion !== baselineVersion.current) {
        setPendingVersion(appVersion);
      }
    } catch {
      // Ignore — network blip; we'll retry next interval.
    }
  }, []);

  // Apply a pending version: clear caches + reload (smart vs hard).
  const apply = useCallback(async (newVersion: string) => {
    // Persist the new version BEFORE we reload so the post-reload tab
    // doesn't immediately see a "mismatch" again and bounce.
    try { localStorage.setItem(VERSION_KEY, newVersion); } catch {}
    await clearAllCaches();
    hardReload();
  }, []);

  // Poll every POLL_INTERVAL_MS, plus on focus / visibility change.
  useEffect(() => {
    check();
    const id = window.setInterval(check, POLL_INTERVAL_MS);
    const onVisible = () => { if (!document.hidden) check(); };
    const onFocus = () => check();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [check]);

  // When a pending version exists, decide: reload now or prompt the user.
  useEffect(() => {
    if (!pendingVersion) return;

    // Try to apply silently if nothing is dirty.
    if (!isDirty()) {
      apply(pendingVersion);
      return;
    }

    // Otherwise re-evaluate dirtiness every 30 s — if the screen goes
    // clean (modal closes, form submits, etc.) we apply silently.
    const id = window.setInterval(() => {
      if (!isDirty()) {
        apply(pendingVersion);
      }
    }, 30_000);
    return () => window.clearInterval(id);
  }, [pendingVersion, apply]);

  if (!pendingVersion) return null;
  // While dirty, show the soft-prompt toast so the user can opt in early.
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 'max(env(safe-area-inset-left, 0px), 12px)',
        right: 'max(env(safe-area-inset-right, 0px), 12px)',
        bottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
        margin: '0 auto',
        maxWidth: 420,
        zIndex: 9999,
        background: 'var(--bg-surface, #fff)',
        color: 'var(--text-primary, #111)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 14,
        lineHeight: 1.35,
      }}
    >
      <span aria-hidden style={{ fontSize: 18 }}>🔄</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        A new version of Myncel is available.
      </span>
      <button
        type="button"
        onClick={() => {
          lastPromptAt.current = Date.now();
          apply(pendingVersion);
        }}
        style={{
          background: '#635bff',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Reload
      </button>
      <button
        type="button"
        onClick={() => {
          // Snooze: hide the toast for REPROMPT_INTERVAL_MS, then it'll
          // reappear if still pending.
          const snoozedUntil = Date.now() + REPROMPT_INTERVAL_MS;
          setPendingVersion(null);
          window.setTimeout(() => {
            // Re-trigger the prompt if version is still mismatched.
            if (Date.now() >= snoozedUntil) check();
          }, REPROMPT_INTERVAL_MS);
        }}
        aria-label="Dismiss"
        style={{
          background: 'transparent',
          color: 'var(--text-secondary, #6b7280)',
          border: 'none',
          fontSize: 18,
          cursor: 'pointer',
          padding: '0 4px',
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
