'use client';

/**
 * OpenInBrowserButton
 *
 * A button that opens an external URL in the device's *system* browser
 * (Chrome / Safari / Firefox / Edge), NOT inside the Capacitor webview.
 *
 * Why this exists
 * ---------------
 * `<a href="..." target="_blank">` does not work reliably inside the Myncel
 * Capacitor Android shell. Capacitor's default link policy intercepts
 * `_blank` and either:
 *   - Does nothing (button appears dead — the bug the user reported)
 *   - Reloads the URL inside the same in-app webview (also wrong: we want
 *     the user OUT of the app and into a real browser, e.g. for billing
 *     and pricing pages)
 *
 * Strategy order (each falls through to the next on failure):
 *   1. window.Capacitor.Plugins.Browser.open()     (Capacitor Browser plugin)
 *   2. window.open(url, '_system')                  (Capacitor convention)
 *   3. window.open(url, '_blank')                   (web browser fallback)
 *   4. window.location.href = url                   (last-resort hard nav)
 *
 * Use this anywhere you need to push the user to an external URL on
 * mobile — pricing, billing, marketing site links, support docs that
 * must render in a real browser, etc.
 *
 * On regular desktop / mobile web (no Capacitor), step 3 wins instantly
 * and behaves identically to a normal `<a target="_blank">`.
 */

import React, { useState } from 'react';

interface Props {
  url: string;
  className?: string;
  children: React.ReactNode;
  /**
   * Optional analytics callback fired when the user clicks. Runs before
   * the navigation attempt so it always gets a chance to flush.
   */
  onClick?: () => void;
}

export default function OpenInBrowserButton({ url, className, children, onClick }: Props) {
  const [opening, setOpening] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (opening) return;
    setOpening(true);
    try {
      onClick?.();
    } catch {}

    try {
      // Strategy 1: Capacitor Browser plugin (when shell has @capacitor/browser).
      const cap = (window as unknown as { Capacitor?: { Plugins?: { Browser?: { open?: (opts: { url: string; presentationStyle?: string }) => Promise<void> } } } })?.Capacitor;
      const browserPlugin = cap?.Plugins?.Browser;
      if (browserPlugin && typeof browserPlugin.open === 'function') {
        try {
          await browserPlugin.open({ url, presentationStyle: 'popover' });
          return;
        } catch (err) {
          // Plugin present but failed — fall through.
          // eslint-disable-next-line no-console
          console.warn('[OpenInBrowserButton] Capacitor Browser.open failed', err);
        }
      }

      // Strategy 2: Capacitor's _system target convention. On Android this
      // explicitly routes to the system browser; on iOS it opens Safari.
      try {
        const opened = window.open(url, '_system');
        if (opened) return;
      } catch {
        /* fall through */
      }

      // Strategy 3: regular _blank (works on all desktop / mobile web).
      try {
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (opened) return;
      } catch {
        /* fall through */
      }

      // Strategy 4: hard navigation as last resort.
      window.location.href = url;
    } finally {
      // Re-enable in case the user comes back without a full reload.
      setTimeout(() => setOpening(false), 1500);
    }
  }

  return (
    <a
      href={url}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-busy={opening || undefined}
    >
      {children}
    </a>
  );
}
