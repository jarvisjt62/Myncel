'use client';

import { useMemo, useState } from 'react';

type SubmissionType = 'CONTACT' | 'SUPPORT' | 'LEAD' | 'PARTNER';
type ReadFilter = 'ALL' | 'UNREAD' | 'READ';

type FormSubmission = {
  id: string;
  type: SubmissionType;
  name: string;
  email: string;
  company: string | null;
  subject: string | null;
  source: string | null;
  recipient: string | null;
  payload: any;
  isRead: boolean;
  readAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type Counts = {
  total: number;
  unread: number;
  byType: Record<SubmissionType, number>;
};

const typeLabels: Record<SubmissionType, string> = {
  CONTACT: 'Contact',
  SUPPORT: 'Support',
  LEAD: 'Lead',
  PARTNER: 'Partner',
};

const typeIcons: Record<SubmissionType, string> = {
  CONTACT: '✉️',
  SUPPORT: '🎧',
  LEAD: '📥',
  PARTNER: '🤝',
};

const typeColors: Record<SubmissionType, string> = {
  CONTACT: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  SUPPORT: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  LEAD: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  PARTNER: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

function formatDate(value: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function payloadEntries(payload: any) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];
  return Object.entries(payload).filter(([, value]) => value !== null && value !== undefined && value !== '');
}

export default function AdminFormSubmissionsClient({
  initialSubmissions,
  initialCounts,
}: {
  initialSubmissions: FormSubmission[];
  initialCounts: Counts;
}) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>(initialSubmissions);
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [selected, setSelected] = useState<FormSubmission | null>(initialSubmissions[0] || null);
  const [typeFilter, setTypeFilter] = useState<'ALL' | SubmissionType>('ALL');
  const [readFilter, setReadFilter] = useState<ReadFilter>('ALL');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return submissions.filter((submission) => {
      if (typeFilter !== 'ALL' && submission.type !== typeFilter) return false;
      if (readFilter === 'UNREAD' && submission.isRead) return false;
      if (readFilter === 'READ' && !submission.isRead) return false;

      if (!query) return true;

      const haystack = [
        submission.name,
        submission.email,
        submission.company || '',
        submission.subject || '',
        submission.source || '',
        submission.recipient || '',
        JSON.stringify(submission.payload || {}),
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }, [submissions, typeFilter, readFilter, search]);

  async function refreshSubmissions() {
    setRefreshing(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (readFilter === 'UNREAD') params.set('status', 'unread');
      if (readFilter === 'READ') params.set('status', 'read');
      if (search.trim()) params.set('search', search.trim());

      const response = await fetch(`/api/admin/form-submissions?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh submissions');
      }

      setSubmissions(data.submissions || []);
      setCounts(data.counts || counts);
      setSelected((current) => {
        if (!current) return data.submissions?.[0] || null;
        return data.submissions?.find((item: FormSubmission) => item.id === current.id) || data.submissions?.[0] || null;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to refresh submissions');
    } finally {
      setRefreshing(false);
    }
  }

  async function updateReadStatus(submission: FormSubmission, isRead: boolean) {
    setUpdatingId(submission.id);
    setError('');

    try {
      const response = await fetch('/api/admin/form-submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submission.id, isRead }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update submission');
      }

      const updated = data.submission as FormSubmission;
      setSubmissions((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setSelected((current) => (current?.id === updated.id ? updated : current));
      setCounts((current) => ({
        ...current,
        unread: Math.max(0, current.unread + (isRead ? -1 : 1)),
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to update submission');
    } finally {
      setUpdatingId(null);
    }
  }

  const unreadFiltered = filtered.filter((item) => !item.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Form Submissions</h1>
            {counts.unread > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold">
                {counts.unread} unread
              </span>
            )}
          </div>
          <p className="text-[var(--text-secondary)] mt-1">
            View partner applications, contact requests, support tickets, and downloaded-guide leads submitted through Myncel.
          </p>
        </div>

        <button
          onClick={refreshSubmissions}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {refreshing ? 'Refreshing…' : 'Refresh submissions'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`text-left rounded-xl border p-4 transition-colors ${
            typeFilter === 'ALL'
              ? 'bg-[var(--accent)]/10 border-[var(--accent)]'
              : 'bg-[var(--bg-surface)] border-[var(--border)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">All</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{counts.total}</p>
        </button>
        {(Object.keys(typeLabels) as SubmissionType[]).map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`text-left rounded-xl border p-4 transition-colors ${
              typeFilter === type
                ? 'bg-[var(--accent)]/10 border-[var(--accent)]'
                : 'bg-[var(--bg-surface)] border-[var(--border)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">
              {typeIcons[type]} {typeLabels[type]}
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{counts.byType[type] || 0}</p>
          </button>
        ))}
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, company, subject, source, or message…"
            className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
          />
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'UNREAD', 'READ'] as ReadFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setReadFilter(filter)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  readFilter === filter
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {filter === 'ALL' ? 'All status' : filter === 'UNREAD' ? `Unread (${unreadFiltered})` : 'Read'}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-3 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-surface-2)]">
                  {['Status', 'Type', 'Name', 'Email', 'Company', 'Subject / Source', 'Submitted'].map((heading) => (
                    <th key={heading} className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((submission) => (
                  <tr
                    key={submission.id}
                    onClick={() => setSelected(submission)}
                    className={`cursor-pointer transition-colors hover:bg-[var(--bg-hover)]/70 ${
                      selected?.id === submission.id ? 'bg-[var(--accent)]/8' : ''
                    } ${!submission.isRead ? 'font-semibold' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-semibold ${
                        submission.isRead
                          ? 'bg-gray-500/10 text-[var(--text-secondary)] border-gray-500/20'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${submission.isRead ? 'bg-gray-400' : 'bg-red-400'}`} />
                        {submission.isRead ? 'Read' : 'New'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-semibold ${typeColors[submission.type]}`}>
                        {typeIcons[submission.type]} {typeLabels[submission.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)] whitespace-nowrap">{submission.name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)] whitespace-nowrap">{submission.email}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)] whitespace-nowrap">{submission.company || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      <div className="max-w-[260px] truncate">{submission.subject || submission.source || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">{formatDate(submission.createdAt)}</td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center text-[var(--text-secondary)]">
                      No form submissions match your filters yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden xl:sticky xl:top-20 xl:self-start">
          {selected ? (
            <div>
              <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-surface-2)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-semibold ${typeColors[selected.type]}`}>
                      {typeIcons[selected.type]} {typeLabels[selected.type]}
                    </span>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mt-3">{selected.name}</h2>
                    <p className="text-sm text-[var(--text-secondary)]">{selected.email}</p>
                  </div>
                  <button
                    onClick={() => updateReadStatus(selected, !selected.isRead)}
                    disabled={updatingId === selected.id}
                    className="px-3 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {updatingId === selected.id ? 'Saving…' : selected.isRead ? 'Mark unread' : 'Mark read'}
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                  <div className="rounded-lg bg-[var(--bg-page)] border border-[var(--border)] p-3">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">Submitted</p>
                    <p className="text-sm text-[var(--text-primary)] mt-1">{formatDate(selected.createdAt)}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-page)] border border-[var(--border)] p-3">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">Recipient</p>
                    <p className="text-sm text-[var(--text-primary)] mt-1 break-all">{selected.recipient || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-page)] border border-[var(--border)] p-3">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">Company</p>
                    <p className="text-sm text-[var(--text-primary)] mt-1">{selected.company || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-page)] border border-[var(--border)] p-3">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">Subject / Source</p>
                    <p className="text-sm text-[var(--text-primary)] mt-1">{selected.subject || selected.source || '—'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Submission details</h3>
                  <div className="space-y-3">
                    {payloadEntries(selected.payload).map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-[var(--bg-page)] border border-[var(--border)] p-3">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())}
                        </p>
                        <p className="text-sm text-[var(--text-primary)] mt-1 whitespace-pre-wrap break-words">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </p>
                      </div>
                    ))}

                    {payloadEntries(selected.payload).length === 0 && (
                      <p className="text-sm text-[var(--text-secondary)]">No extra submission data was stored.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <a
                    href={`mailto:${selected.email}`}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--bg-hover)] text-[var(--text-primary)] text-sm font-semibold hover:opacity-90"
                  >
                    Reply by email
                  </a>
                  <button
                    onClick={() => navigator.clipboard?.writeText(selected.email)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--bg-hover)] text-[var(--text-primary)] text-sm font-semibold hover:opacity-90"
                  >
                    Copy email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[var(--text-secondary)]">
              Select a submission to see full details.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}