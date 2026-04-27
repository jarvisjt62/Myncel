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

  // Create form
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
    <div className="min-h-screen bg-[var(--bg-base,#070d1a)] text-white p-6 max-w-4xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl border ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            : 'bg-red-500/20 border-red-500/40 text-red-300'
        }`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#8892a4] text-sm mb-2">
            <Link href="/settings" className="hover:text-white transition-colors">Settings</Link>
            <span>›</span>
            <span className="text-white">API Keys</span>
          </div>
          <h1 className="text-2xl font-bold text-white">API Key Management</h1>
          <p className="text-[#8892a4] mt-1 text-sm">
            Manage API keys for IoT sensor integration and external services.
            Keys authenticate sensor data sent to <code className="text-[#635bff]">/api/iot</code>.
          </p>
        </div>
        <button
          onClick={() => setModal({ kind: 'create' })}
          className="flex items-center gap-2 bg-[#635bff] hover:bg-[#5248e6] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          + New API Key
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-[#635bff]/10 border border-[#635bff]/30 rounded-xl p-4 mb-6 flex gap-3">
        <span className="text-xl flex-shrink-0">🔑</span>
        <div>
          <p className="text-white text-sm font-medium">How to use API keys</p>
          <p className="text-[#8892a4] text-sm mt-1">
            Include your API key in the <code className="text-[#635bff]">X-API-Key</code> header when sending sensor data.
            Each key is scoped to your organization and can be rotated or revoked at any time.
          </p>
          <div className="mt-2 bg-[#070d1a] border border-[#1e2d4a] rounded-lg p-3 font-mono text-xs text-emerald-400">
            curl -X POST /api/iot -H "X-API-Key: YOUR_KEY" -d &#39;{'{'}...{'}'}&#39;
          </div>
        </div>
      </div>

      {/* Keys list */}
      <div className="bg-[#0d1426] border border-[#1e2d4a] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d4a]">
          <h2 className="text-white font-semibold">
            Your API Keys
            <span className="ml-2 text-[#8892a4] text-sm font-normal">({keys.length}/10)</span>
          </h2>
          <Link href="/docs/api" className="text-[#635bff] text-sm hover:underline">
            View API Docs →
          </Link>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-[#8892a4]">
            <div className="animate-spin text-3xl mb-3">⟳</div>
            Loading keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl mb-3">🔑</div>
            <p className="text-white font-medium mb-1">No API keys yet</p>
            <p className="text-[#8892a4] text-sm mb-4">Create your first key to start connecting IoT sensors.</p>
            <button
              onClick={() => setModal({ kind: 'create' })}
              className="bg-[#635bff] hover:bg-[#5248e6] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Create API Key
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#1e2d4a]">
            {keys.map(key => (
              <div key={key.id} className="px-6 py-4 flex items-center gap-4 hover:bg-[#1e2d4a]/30 transition-colors">

                {/* Status dot */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  key.status === 'CONNECTED' ? 'bg-emerald-400' : 'bg-gray-500'
                }`} />

                {/* Key info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-sm font-semibold">{key.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      key.status === 'CONNECTED'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
                    }`}>
                      {key.status === 'CONNECTED' ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="text-[#8892a4] text-xs font-mono">{key.apiKeyMasked || '••••••••••••••••'}</code>
                    {key.apiKeyFull && (
                      <button
                        onClick={() => copyKey(key.apiKeyFull!, key.id)}
                        className="text-[#635bff] text-xs hover:underline"
                      >
                        {copiedId === key.id ? '✓ Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-[#4a5568] text-xs">
                    <span>Created {formatDate(key.createdAt)}</span>
                    {key.lastUsed && <span>Last used {formatDate(key.lastUsed)}</span>}
                    {key.usageCount > 0 && <span>{key.usageCount.toLocaleString()} requests</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(key)}
                    className="text-xs px-3 py-1.5 bg-[#1e2d4a] hover:bg-[#253550] text-[#8892a4] rounded-lg transition-colors"
                  >
                    {key.status === 'CONNECTED' ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => setModal({ kind: 'rotate', key })}
                    className="text-xs px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-lg transition-colors"
                  >
                    🔄 Rotate
                  </button>
                  <button
                    onClick={() => setModal({ kind: 'delete', key })}
                    className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
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
      <div className="mt-6 bg-[#0d1426] border border-[#1e2d4a] rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-3">🛡️ Security Best Practices</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#8892a4]">
          {[
            'Never share API keys in public repos or client-side code',
            'Use separate keys for different devices or environments',
            'Rotate keys regularly or immediately if compromised',
            'Disable keys for devices that are offline or decommissioned',
            'Monitor usage counts to detect unexpected activity',
            'Store keys in environment variables, never hardcoded',
          ].map(tip => (
            <div key={tip} className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1426] border border-[#1e2d4a] rounded-2xl p-6 w-full max-w-md">

            {/* Create */}
            {modal.kind === 'create' && (
              <>
                <h3 className="text-white font-semibold text-lg mb-4">Create New API Key</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#8892a4] text-xs font-medium mb-1.5 uppercase tracking-wide">Key Name</label>
                    <input
                      autoFocus
                      type="text"
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                      placeholder="e.g. Production Sensors, Line A Gateway"
                      className="w-full bg-[#070d1a] border border-[#1e2d4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a5568] focus:outline-none focus:border-[#635bff] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8892a4] text-xs font-medium mb-1.5 uppercase tracking-wide">Key Type</label>
                    <select
                      value={newKeyType}
                      onChange={e => setNewKeyType(e.target.value)}
                      className="w-full bg-[#070d1a] border border-[#1e2d4a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#635bff] transition-colors"
                    >
                      <option value="IOT">IoT Sensor Data</option>
                      <option value="GENERAL">General / Zapier</option>
                      <option value="READONLY">Read-only</option>
                    </select>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-yellow-400 text-xs">
                    ⚠️ You will only see the full key once. Copy and save it securely.
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setModal(null)} className="flex-1 bg-[#1e2d4a] hover:bg-[#253550] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
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
                  <h3 className="text-white font-semibold text-lg">Your New API Key</h3>
                  <p className="text-[#8892a4] text-sm mt-1">
                    This is <strong className="text-white">the only time</strong> you'll see the full key.
                    Copy it now and store it securely.
                  </p>
                </div>
                <div className="bg-[#070d1a] border border-emerald-500/40 rounded-xl p-4 mb-4">
                  <p className="text-[#8892a4] text-xs mb-1">{modal.keyName}</p>
                  <code className="text-emerald-400 text-sm font-mono break-all">{modal.keyValue}</code>
                </div>
                <button
                  onClick={() => copyKey(modal.keyValue, 'new')}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all mb-3 ${
                    copiedId === 'new'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#635bff] hover:bg-[#5248e6] text-white'
                  }`}
                >
                  {copiedId === 'new' ? '✓ Copied to Clipboard!' : '📋 Copy API Key'}
                </button>
                <button
                  onClick={() => setModal(null)}
                  className="w-full bg-[#1e2d4a] hover:bg-[#253550] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Done
                </button>
              </>
            )}

            {/* Rotate confirmation */}
            {modal.kind === 'rotate' && (
              <>
                <h3 className="text-white font-semibold text-lg mb-2">Rotate API Key</h3>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                  <p className="text-yellow-400 text-sm font-medium">⚠️ This action cannot be undone</p>
                  <p className="text-[#8892a4] text-sm mt-1">
                    Rotating <strong className="text-white">{modal.key.name}</strong> will immediately invalidate
                    the current key. Any devices using the old key will stop working until updated.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="flex-1 bg-[#1e2d4a] hover:bg-[#253550] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRotate(modal.key)}
                    disabled={working}
                    className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 disabled:opacity-50 text-yellow-400 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    {working ? 'Rotating...' : '🔄 Rotate Key'}
                  </button>
                </div>
              </>
            )}

            {/* Delete confirmation */}
            {modal.kind === 'delete' && (
              <>
                <h3 className="text-white font-semibold text-lg mb-2">Revoke API Key</h3>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                  <p className="text-red-400 text-sm font-medium">🗑️ Permanently delete this key</p>
                  <p className="text-[#8892a4] text-sm mt-1">
                    <strong className="text-white">{modal.key.name}</strong> will be permanently deleted.
                    Devices using this key will immediately lose access. This cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="flex-1 bg-[#1e2d4a] hover:bg-[#253550] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(modal.key)}
                    disabled={working}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50 text-red-400 font-semibold py-2.5 rounded-xl text-sm transition-colors"
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
  );
}