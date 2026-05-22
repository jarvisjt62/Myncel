'use client';

import { useEffect, useState } from 'react';

interface ChatRow {
  id: string;
  createdAt: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  question: string;
  answerLength: number | null;
  source: string;
  provider: string | null;
  model: string | null;
  error: string | null;
}

interface FeedbackRow {
  id: string;
  createdAt: string;
  userEmail: string | null;
  rating: 'up' | 'down' | 'unknown';
  question: string;
  answer: string;
  comment: string | null;
}

interface ApiResponse {
  counts: { today: number; sevenDays: number; thirtyDays: number; sampleWindow: number };
  sourceTallies: { llm: number; fallback_kb: number; fallback_generic: number; error: number; other: number };
  ratingTallies: { up: number; down: number };
  config: {
    groqConfigured: boolean;
    openaiConfigured: boolean;
    activeProvider: string;
    activeModel: string;
    modelOverridden: boolean;
  };
  chat: ChatRow[];
  feedback: FeedbackRow[];
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function sourceBadge(s: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    llm: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '🤖 LLM' },
    fallback_kb: { bg: 'bg-amber-100', text: 'text-amber-700', label: '📚 KB' },
    fallback_generic: { bg: 'bg-orange-100', text: 'text-orange-700', label: '📋 Generic' },
    error: { bg: 'bg-red-100', text: 'text-red-700', label: '⚠️ Error' },
  };
  const c = map[s] || { bg: 'bg-gray-100', text: 'text-gray-700', label: s };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded ${c.bg} ${c.text} font-medium`}>
      {c.label}
    </span>
  );
}

export default function AiChatLogPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (sourceFilter) params.set('source', sourceFilter);
      if (search) params.set('q', search);
      params.set('limit', '200');

      const res = await fetch(`/api/admin/ai-chat-log?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const t = setInterval(fetchData, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, sourceFilter, search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    if (!data) return;
    const visibleIds = new Set(data.chat.map((r) => r.id));
    const allSelected = data.chat.every((r) => selected.has(r.id));
    setSelected(allSelected ? new Set() : visibleIds);
  };

  const flashMsg = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 4000);
  };

  const deleteByIds = async (ids: string[], scope: 'chat' | 'feedback' | 'all' = 'chat') => {
    if (ids.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/ai-chat-log?ids=${ids.join(',')}&scope=${scope}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      flashMsg(`✅ Deleted ${json.deleted} row(s)`);
      setSelected(new Set());
      fetchData();
    } catch (e: any) {
      flashMsg(`❌ Delete failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const deleteOlderThan = async (days: number, scope: 'chat' | 'feedback' | 'all' = 'all') => {
    if (!confirm(`Delete ALL ${scope === 'all' ? 'chat & feedback' : scope} rows older than ${days} days? This can't be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/ai-chat-log?olderThanDays=${days}&scope=${scope}`,
        { method: 'DELETE', headers: { 'X-Confirm-Delete': 'yes' } }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      flashMsg(`✅ Deleted ${json.deleted} row(s) older than ${days} days`);
      fetchData();
    } catch (e: any) {
      flashMsg(`❌ Delete failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const deleteAll = async (scope: 'chat' | 'feedback' | 'all' = 'all') => {
    const label = scope === 'all' ? 'EVERY chat AND feedback row' : `EVERY ${scope} row`;
    if (!confirm(`⚠️ DANGER: Delete ${label}? This wipes the entire AI chat history. Type confirm in the next dialog to proceed.`)) return;
    const typed = prompt('Type DELETE ALL to confirm:');
    if (typed !== 'DELETE ALL') {
      flashMsg('Cancelled (confirmation phrase did not match)');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ai-chat-log?all=true&scope=${scope}`, {
        method: 'DELETE',
        headers: { 'X-Confirm-Delete': 'yes' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      flashMsg(`✅ Deleted ${json.deleted} row(s) — entire history wiped`);
      setSelected(new Set());
      fetchData();
    } catch (e: any) {
      flashMsg(`❌ Delete failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#0a2540]">🧠 AI Chat Log</h1>
        <p className="text-[#425466] mt-2">Loading…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#0a2540]">🧠 AI Chat Log</h1>
        <p className="text-red-600 mt-2">Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const totalRatings = data.ratingTallies.up + data.ratingTallies.down;
  const helpfulPct = totalRatings > 0 ? Math.round((data.ratingTallies.up / totalRatings) * 100) : null;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-[#0a2540]">🧠 AI Chat Log</h1>
        <label className="flex items-center gap-2 text-sm text-[#425466]">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          Auto-refresh (15s)
        </label>
      </div>
      <p className="text-[#425466] text-sm mb-6">
        Every question users ask the Myncel AI assistant. See what's working, what's missing, and which answers got 👍 / 👎.
      </p>

      {flash && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
          {flash}
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatTile label="Today" value={data.counts.today} />
        <StatTile label="Last 7 days" value={data.counts.sevenDays} />
        <StatTile label="Last 30 days" value={data.counts.thirtyDays} />
        <StatTile
          label="👍 / 👎"
          value={`${data.ratingTallies.up} / ${data.ratingTallies.down}`}
          subtitle={helpfulPct !== null ? `${helpfulPct}% helpful` : 'no votes yet'}
        />
        <StatTile
          label="LLM vs fallback"
          value={`${data.sourceTallies.llm} / ${data.sourceTallies.fallback_kb + data.sourceTallies.fallback_generic}`}
          subtitle={`window: ${data.counts.sampleWindow}`}
        />
      </div>

      {/* Configuration card */}
      <div className="bg-white border border-[#e6ebf1] rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-[#0a2540] mb-3">⚙️ Configuration</h2>
        <div className="flex flex-wrap gap-2">
          <ConfigPill ok={data.config.groqConfigured} label="GROQ_API_KEY" />
          <ConfigPill ok={data.config.openaiConfigured} label="OPENAI_API_KEY" />
          <span className="inline-block px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 font-medium">
            Active provider: <b>{data.config.activeProvider}</b>
          </span>
          <span className="inline-block px-3 py-1 text-xs rounded bg-purple-100 text-purple-700 font-medium">
            Model: <b>{data.config.activeModel}</b>
            {data.config.modelOverridden && ' (override)'}
          </span>
        </div>
        {!data.config.groqConfigured && !data.config.openaiConfigured && (
          <p className="text-amber-700 text-sm mt-3">
            ⚠️ No LLM key configured. Assistant is running in fallback-KB mode. Set <code className="bg-amber-100 px-1 rounded">GROQ_API_KEY</code> in Vercel for real AI answers.
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e6ebf1] rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-[#425466] mb-1">Source</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 border border-[#e6ebf1] rounded text-sm"
          >
            <option value="">All</option>
            <option value="llm">🤖 LLM only</option>
            <option value="fallback_kb">📚 KB fallback</option>
            <option value="fallback_generic">📋 Generic fallback</option>
            <option value="error">⚠️ Error</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-[#425466] mb-1">Search question</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. pricing, predictive maintenance…"
            className="w-full px-3 py-2 border border-[#e6ebf1] rounded text-sm"
          />
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-[#635bff] text-white text-sm rounded hover:bg-[#5b54e0]"
        >
          Refresh
        </button>
      </div>

      {/* Recent feedback */}
      {data.feedback.length > 0 && (
        <div className="bg-white border border-[#e6ebf1] rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-[#0a2540] mb-3">💬 Recent feedback ({data.feedback.length})</h2>
          <div className="space-y-2 max-h-80 overflow-auto">
            {data.feedback.slice(0, 50).map((f) => (
              <div key={f.id} className="border-l-4 pl-3 py-1 flex items-start justify-between gap-2" style={{ borderColor: f.rating === 'up' ? '#10b981' : '#ef4444' }}>
                <div className="flex-1">
                  <div className="text-xs text-[#8898aa] flex gap-3">
                    <span>{fmtTime(f.createdAt)}</span>
                    <span>{f.rating === 'up' ? '👍 Helpful' : '👎 Not helpful'}</span>
                    {f.userEmail && <span>{f.userEmail}</span>}
                  </div>
                  <div className="text-sm text-[#0a2540] mt-1"><b>Q:</b> {f.question}</div>
                  {f.comment && <div className="text-sm text-[#425466] mt-1"><b>Comment:</b> {f.comment}</div>}
                </div>
                <button
                  disabled={busy}
                  onClick={() => {
                    if (confirm('Delete this feedback row?')) deleteByIds([f.id], 'feedback');
                  }}
                  className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50"
                  title="Delete feedback row"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat log table */}
      <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e6ebf1] flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-[#0a2540]">📜 Recent Q&A ({data.chat.length})</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {selected.size > 0 && (
              <>
                <span className="text-sm text-[#425466]">{selected.size} selected</span>
                <button
                  disabled={busy}
                  onClick={() => deleteByIds(Array.from(selected), 'chat')}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                >
                  🗑 Delete selected
                </button>
                <button
                  disabled={busy}
                  onClick={() => setSelected(new Set())}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                >
                  Clear
                </button>
              </>
            )}
            {error && <span className="text-xs text-amber-700">stale: {error}</span>}
          </div>
        </div>
        {data.chat.length === 0 ? (
          <p className="p-5 text-[#8898aa] text-sm">No matching chat turns yet.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f6f9fc] text-[#425466] text-xs uppercase">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={data.chat.length > 0 && data.chat.every((r) => selected.has(r.id))}
                      onChange={selectAllVisible}
                      title="Select all visible"
                    />
                  </th>
                  <th className="text-left p-3">Time</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Question</th>
                  <th className="text-left p-3">Source</th>
                  <th className="text-left p-3">Model</th>
                  <th className="text-right p-3">Ans len</th>
                  <th className="text-right p-3 w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.chat.map((row) => {
                  const expanded = expandedId === row.id;
                  return (
                    <FragmentRow
                      key={row.id}
                      row={row}
                      expanded={expanded}
                      checked={selected.has(row.id)}
                      onToggleSelect={() => toggleSelect(row.id)}
                      onToggle={() => setExpandedId(expanded ? null : row.id)}
                      onDelete={() => {
                        if (confirm('Delete this Q&A row?')) deleteByIds([row.id], 'chat');
                      }}
                      busy={busy}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-white border-2 border-red-200 rounded-xl p-5 mt-6">
        <h2 className="text-lg font-semibold text-red-700 mb-1">⚠️ Danger Zone</h2>
        <p className="text-[#425466] text-sm mb-4">
          Bulk delete chat history. These actions cannot be undone — the rows are removed from <code className="bg-gray-100 px-1 rounded">AuditLog</code> permanently.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={() => deleteOlderThan(30, 'all')}
            className="px-3 py-2 bg-amber-100 text-amber-800 text-sm rounded hover:bg-amber-200 disabled:opacity-50"
          >
            🗑 Delete chat & feedback older than 30 days
          </button>
          <button
            disabled={busy}
            onClick={() => deleteOlderThan(90, 'all')}
            className="px-3 py-2 bg-amber-100 text-amber-800 text-sm rounded hover:bg-amber-200 disabled:opacity-50"
          >
            🗑 Delete older than 90 days
          </button>
          <button
            disabled={busy}
            onClick={() => deleteAll('chat')}
            className="px-3 py-2 bg-red-100 text-red-800 text-sm rounded hover:bg-red-200 disabled:opacity-50"
          >
            🔥 Delete ALL chat rows
          </button>
          <button
            disabled={busy}
            onClick={() => deleteAll('feedback')}
            className="px-3 py-2 bg-red-100 text-red-800 text-sm rounded hover:bg-red-200 disabled:opacity-50"
          >
            🔥 Delete ALL feedback
          </button>
          <button
            disabled={busy}
            onClick={() => deleteAll('all')}
            className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
          >
            💥 Wipe everything (chat + feedback)
          </button>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, subtitle }: { label: string; value: string | number; subtitle?: string }) {
  return (
    <div className="bg-white border border-[#e6ebf1] rounded-xl p-4">
      <p className="text-xs text-[#8898aa] uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-[#0a2540] mt-1">{value}</p>
      {subtitle && <p className="text-xs text-[#8898aa] mt-1">{subtitle}</p>}
    </div>
  );
}

function ConfigPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-block px-3 py-1 text-xs rounded font-medium ${
        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {ok ? '✅' : '⚪'} {label}
    </span>
  );
}

function FragmentRow({
  row,
  expanded,
  checked,
  onToggleSelect,
  onToggle,
  onDelete,
  busy,
}: {
  row: ChatRow;
  expanded: boolean;
  checked: boolean;
  onToggleSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <>
      <tr className="border-t border-[#e6ebf1] hover:bg-[#f6f9fc]">
        <td className="p-3" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={checked} onChange={onToggleSelect} />
        </td>
        <td className="p-3 text-[#425466] whitespace-nowrap cursor-pointer" onClick={onToggle}>{fmtTime(row.createdAt)}</td>
        <td className="p-3 text-[#425466] cursor-pointer" onClick={onToggle}>{row.userEmail || <span className="text-[#8898aa]">anonymous</span>}</td>
        <td className="p-3 text-[#0a2540] max-w-md truncate cursor-pointer" onClick={onToggle}>{row.question}</td>
        <td className="p-3 cursor-pointer" onClick={onToggle}>{sourceBadge(row.source)}</td>
        <td className="p-3 text-[#425466] text-xs cursor-pointer" onClick={onToggle}>
          {row.provider || '—'}
          {row.model && <div className="text-[#8898aa]">{row.model}</div>}
        </td>
        <td className="p-3 text-right text-[#425466] cursor-pointer" onClick={onToggle}>{row.answerLength ?? '—'}</td>
        <td className="p-3 text-right">
          <button
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-500 hover:text-red-700 disabled:opacity-50"
            title="Delete row"
          >
            🗑
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[#f6f9fc]">
          <td colSpan={8} className="p-4 text-sm">
            <div className="text-[#0a2540] whitespace-pre-wrap">
              <b>Question:</b> {row.question}
            </div>
            {row.error && (
              <div className="text-red-600 mt-2 text-xs">
                <b>Error:</b> {row.error}
              </div>
            )}
            <div className="text-[#8898aa] text-xs mt-2">
              ID: {row.id} · userId: {row.userId || 'anonymous'}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
