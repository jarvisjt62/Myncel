'use client';

import { useState } from 'react';

/**
 * Admin → Emergency Broadcast page.
 *
 * Sends a high-priority push + creates an in-app Notification row for every
 * user in the caller's organization. Emergency pushes BYPASS quiet hours.
 *
 * Backed by POST /api/admin/emergency.
 */
export default function EmergencyBroadcastClient() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    recipientCount?: number;
    pushesSent?: number;
    pushesSkipped?: number;
    pushSkipReason?: string | null;
    error?: string;
  } | null>(null);

  const charsTitle = title.length;
  const charsMessage = message.length;
  const titleOk = charsTitle > 0 && charsTitle <= 120;
  const messageOk = charsMessage > 0 && charsMessage <= 500;
  const canSend = titleOk && messageOk && !sending;

  async function handleSend() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/emergency', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, message, link: link.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ ok: false, error: data?.error || `HTTP ${res.status}` });
      } else {
        setResult({ ok: true, ...data });
        setTitle('');
        setMessage('');
        setLink('');
      }
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || 'Network error' });
    } finally {
      setSending(false);
      setConfirming(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>🚨 Emergency Broadcast</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Send an URGENT alert to every user in your organization. Emergency pushes bypass quiet hours and always reach mobile devices that have opted in.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
        <p className="font-semibold mb-1">⚠️ Use sparingly</p>
        <p>
          Emergency broadcasts interrupt every team member, on every device, regardless of their quiet-hours preferences. Use this only for true emergencies — equipment fires, safety incidents, evacuations, or critical operational stops.
        </p>
      </div>

      <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Title <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({charsTitle}/120)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
            placeholder="e.g. Boiler #2 emergency shutdown — evacuate Bay 4"
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Message <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({charsMessage}/500)</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={500}
            rows={5}
            placeholder="Provide clear, actionable detail. What happened, what to do, where to go."
            className="w-full px-3 py-2 rounded-lg border text-sm resize-y"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Deep-link URL <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(optional)</span>
          </label>
          <input
            type="url"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://www.myncel.com/dashboard?tab=alerts"
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Where to send users when they tap the notification. Defaults to /dashboard.
          </p>
        </div>

        {/* Preview */}
        {(title || message) && (
          <div className="border rounded-lg p-4" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-2)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>PREVIEW</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              🚨 {title || '(title)'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {message || '(message)'}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              disabled={!canSend}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
            >
              Send emergency broadcast
            </button>
          ) : (
            <>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Send to <strong>everyone</strong> in your org — confirm?
              </span>
              <button
                onClick={() => setConfirming(false)}
                disabled={sending}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
              >
                {sending ? 'Sending...' : 'Yes, send it'}
              </button>
            </>
          )}
        </div>

        {result && (
          <div
            className={`mt-3 p-3 rounded-lg text-sm ${
              result.ok ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            {result.ok ? (
              <>
                ✓ Broadcast sent to <strong>{result.recipientCount}</strong> recipient(s).{' '}
                {typeof result.pushesSent === 'number' && (
                  <>Push delivered to {result.pushesSent}{result.pushesSkipped ? ` (${result.pushesSkipped} skipped: ${result.pushSkipReason})` : ''}.</>
                )}
              </>
            ) : (
              <>⚠️ {result.error}</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
