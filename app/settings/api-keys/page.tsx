'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ApiKey {
  id: string;
  name: string;
  status: string;
  apiKeyMasked: string | null;
  apiKeyFull: string | null;
  lastUsed: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

type ModalType =
  | { kind: 'create' }
  | { kind: 'rotate'; key: ApiKey }
  | { kind: 'delete'; key: ApiKey }
  | { kind: 'newKey'; keyValue: string; keyName: string }
  | null;

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [working, setWorking] = useState(false);

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState('IOT');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/api-keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (e) {
      console.error('Failed to fetch keys:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setWorking(true);
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim(), type: newKeyType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create key');
      setModal({ kind: 'newKey', keyValue: data.apiKey, keyName: data.name });
      setNewKeyName('');
      fetchKeys();
    } catch (e: any) {
      showToast('error', e.message);
      setModal(null);
    } finally {
      setWorking(false);
    }
  };

  const handleRotate = async (key: ApiKey) => {
    setWorking(true);
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key.id, action: 'rotate' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to rotate key');
      setModal({ kind: 'newKey', keyValue: data.apiKey, keyName: key.name });
      fetchKeys();
      showToast('success', 'API key rotated. The old key is now invalid.');
    } catch (e: any) {
      showToast('error', e.message);
      setModal(null);
    } finally {
      setWorking(false);
    }
  };

  const handleToggle = async (key: ApiKey) => {
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key.id, action: 'disable' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update key');
      showToast('success', `Key ${data.status === 'CONNECTED' ? 'enabled' : 'disabled'}`);
      fetchKeys();
    } catch (e: any) {
      showToast('error', e.message);
    }
  };

  const handleDelete = async (key: ApiKey) => {
    setWorking(true);
    try {
      const res = await fetch(`/api/settings/api-keys?id=${key.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete key');
      showToast('success', 'API key revoked and deleted.');
      setModal(null);
      fetchKeys();
    } catch (e: any) {
      showToast('error', e.message);
      setModal(null);
    } finally {
      setWorking(false);
    }
  };

  const copyKey = (value: string, id: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <div className="max-w-4xl mx-auto p-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl border ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
              : 'bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-300'
          }`}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.text}
          </div>
        )}

        {/* Back nav */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              <Link href="/settings" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>Settings</Link>
              <span>›</span>
              <span style={{ color: 'var(--text-primary)' }}>API Keys</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>API Key Management</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Manage API keys for IoT sensor integration and external services.
              Keys authenticate sensor data sent to{' '}
              <code className="text-[#635bff] bg-[#635bff]/10 px-1.5 py-0.5 rounded text-xs">/api/iot</code>.
            </p>
          </div>
          <button
            onClick={() => setModal({ kind: 'create' })}
            className="flex items-center gap-2 bg-[#635bff] hover:bg-[#5248e6] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm flex-shrink-0"
          >
            + New API Key
          </button>
        </div>

        {/* Info banner */}
        <div className="rounded-xl p-4 mb-6 flex gap-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <span className="text-xl flex-shrink-0">🔑</span>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>How to use API keys</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Include your API key in the{' '}
              <code className="text-[#635bff] bg-[#635bff]/10 px-1 rounded text-xs">X-API-Key</code>{' '}
              header when sending sensor data. Each key is scoped to your organization.
            </p>
            <div className="mt-2 rounded-lg p-3 font-mono text-xs text-emerald-600 dark:text-emerald-400"
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}>
              curl -X POST /api/iot -H "X-API-Key: YOUR_KEY" -d '&#123;...&#125;'
            </div>
          </div>
        </div>

        {/* Keys list */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Your API Keys
              <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>({keys.length}/10)</span>
            </h2>
            <Link href="/docs/api" className="text-[#635bff] text-sm hover:underline">
              View API Docs →
            </Link>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center" style={{ color: 'var(--text-secondary)' }}>
              <div className="animate-spin text-3xl mb-3">⟳</div>
              Loading keys...
            </div>
          ) : keys.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-4xl mb-3">🔑</div>
              <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No API keys yet</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Create your first key to start connecting IoT sensors.</p>
              <button
                onClick={() => setModal({ kind: 'create' })}
                className="bg-[#635bff] hover:bg-[#5248e6] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Create API Key
              </button>
            </div>
          ) : (
            <div>
              {keys.map(key => (
                <div key={key.id} className="px-6 py-4 flex items-center gap-4 transition-colors hover:bg-[var(--bg-hover,rgba(0,0,0,0.03))]"
                  style={{ borderBottom: '1px solid var(--border)' }}>

                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    key.status === 'CONNECTED' ? 'bg-emerald-400' : 'bg-gray-400'
                  }`} />

                  {/* Key info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{key.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        key.status === 'CONNECTED'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-gray-500/15 text-gray-500 border-gray-400/30'
                      }`}>
                        {key.status === 'CONNECTED' ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {key.apiKeyMasked || '••••••••••••••••'}
                      </code>
                      {key.apiKeyFull && (
                        <button
                          onClick={() => copyKey(key.apiKeyFull!, key.id)}
                          className="text-[#635bff] text-xs hover:underline"
                        >
                          {copiedId === key.id ? '✓ Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>Created {formatDate(key.createdAt)}</span>
                      {key.lastUsed && <span>Last used {formatDate(key.lastUsed)}</span>}
                      {key.usageCount > 0 && <span>{key.usageCount.toLocaleString()} requests</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(key)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    >
                      {key.status === 'CONNECTED' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => setModal({ kind: 'rotate', key })}
                      className="text-xs px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 rounded-lg transition-colors"
                    >
                      🔄 Rotate
                    </button>
                    <button
                      onClick={() => setModal({ kind: 'delete', key })}
                      className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg transition-colors"
                    >
                      🗑️ Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security tips */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🛡️ Security Best Practices</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {[
              'Never share API keys in public repos or client-side code',
              'Use separate keys for different devices or environments',
              'Rotate keys regularly or immediately if compromised',
              'Disable keys for devices that are offline or decommissioned',
              'Monitor usage counts to detect unexpected activity',
              'Store keys in environment variables, never hardcoded',
            ].map(tip => (
              <div key={tip} className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Modals ────────────────────────────────────────────── */}
        {modal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

              {/* Create */}
              {modal.kind === 'create' && (
                <>
                  <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Create New API Key</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Key Name</label>
                      <input
                        autoFocus
                        type="text"
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        placeholder="e.g. Production Sensors, Line A Gateway"
                        className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/50 transition-all"
                        style={{
                          backgroundColor: 'var(--bg-page)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Key Type</label>
                      <select
                        value={newKeyType}
                        onChange={e => setNewKeyType(e.target.value)}
                        className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/50 transition-all"
                        style={{
                          backgroundColor: 'var(--bg-page)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <option value="IOT">IoT Sensor Data</option>
                        <option value="GENERAL">General / Zapier</option>
                        <option value="READONLY">Read-only</option>
                      </select>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-yellow-700 dark:text-yellow-400 text-xs">
                      ⚠️ You will only see the full key once. Copy and save it securely.
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setModal(null)}
                      className="flex-1 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                      style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={working || !newKeyName.trim()}
                      className="flex-1 bg-[#635bff] hover:bg-[#5248e6] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {working ? 'Creating...' : 'Create Key'}
                    </button>
                  </div>
                </>
              )}

              {/* New key reveal */}
              {modal.kind === 'newKey' && (
                <>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🔑</div>
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Your New API Key</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      This is <strong style={{ color: 'var(--text-primary)' }}>the only time</strong> you'll see the full key.
                      Copy it now and store it securely.
                    </p>
                  </div>
                  <div className="rounded-xl p-4 mb-4"
                    style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{modal.keyName}</p>
                    <code className="text-emerald-600 dark:text-emerald-400 text-sm font-mono break-all">{modal.keyValue}</code>
                  </div>
                  <button
                    onClick={() => copyKey(modal.keyValue, 'new')}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all mb-3 ${
                      copiedId === 'new'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#635bff] hover:bg-[#5248e6] text-white'
                    }`}
                  >
                    {copiedId === 'new' ? '✓ Copied to Clipboard!' : '📋 Copy API Key'}
                  </button>
                  <button
                    onClick={() => setModal(null)}
                    className="w-full font-semibold py-2.5 rounded-xl text-sm transition-colors"
                    style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    Done
                  </button>
                </>
              )}

              {/* Rotate confirmation */}
              {modal.kind === 'rotate' && (
                <>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Rotate API Key</h3>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                    <p className="text-yellow-700 dark:text-yellow-400 text-sm font-medium">⚠️ This action cannot be undone</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Rotating <strong style={{ color: 'var(--text-primary)' }}>{modal.key.name}</strong> will immediately invalidate
                      the current key. Any devices using the old key will stop working until updated.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setModal(null)}
                      className="flex-1 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                      style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRotate(modal.key)}
                      disabled={working}
                      className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 disabled:opacity-50 text-yellow-700 dark:text-yellow-400 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {working ? 'Rotating...' : '🔄 Rotate Key'}
                    </button>
                  </div>
                </>
              )}

              {/* Delete confirmation */}
              {modal.kind === 'delete' && (
                <>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Revoke API Key</h3>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                    <p className="text-red-600 dark:text-red-400 text-sm font-medium">🗑️ Permanently delete this key</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{modal.key.name}</strong> will be permanently deleted.
                      Devices using this key will immediately lose access. This cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setModal(null)}
                      className="flex-1 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                      style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(modal.key)}
                      disabled={working}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50 text-red-600 dark:text-red-400 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {working ? 'Deleting...' : '🗑️ Revoke Key'}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}