'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme, ThemeToggle } from '../../components/ThemeProvider'

interface SettingsClientProps {
  organizationId: string
  canCleanup: boolean
  hasData: boolean
}

interface FeatureFlags {
  customersPageEnabled: boolean
  changelogEnabled: boolean
  changelogNote: string
}

export default function SettingsClient({ organizationId, canCleanup, hasData }: SettingsClientProps) {
  const router = useRouter()
  const { theme, isDark } = useTheme()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [flags, setFlags] = useState<FeatureFlags>({
    customersPageEnabled: false,
    changelogEnabled: false,
    changelogNote: '',
  })
  const [flagsLoading, setFlagsLoading] = useState(true)
  const [flagsSaving, setFlagsSaving] = useState(false)
  const [flagsMsg, setFlagsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchFlags()
  }, [])

  const fetchFlags = async () => {
    try {
      const res = await fetch('/api/admin/feature-flags')
      if (res.ok) {
        const data = await res.json()
        setFlags(data.flags)
      }
    } catch (e) {
      console.error('Failed to fetch feature flags:', e)
    } finally {
      setFlagsLoading(false)
    }
  }

  const saveFlags = async (newFlags: Partial<FeatureFlags>) => {
    setFlagsSaving(true)
    setFlagsMsg(null)
    const updated = { ...flags, ...newFlags }
    setFlags(updated)
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flags: updated }),
      })
      if (res.ok) {
        setFlagsMsg({ type: 'success', text: 'Settings saved.' })
        setTimeout(() => setFlagsMsg(null), 3000)
      } else {
        const d = await res.json()
        setFlagsMsg({ type: 'error', text: d.error || 'Failed to save.' })
      }
    } catch {
      setFlagsMsg({ type: 'error', text: 'Failed to save settings.' })
    } finally {
      setFlagsSaving(false)
    }
  }

  const handleCleanup = async () => {
    setIsDeleting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'All data has been cleared successfully!' })
        setShowConfirm(false)
        router.refresh()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to cleanup data' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Appearance ─────────────────────────────────────────────── */}
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          Choose your preferred display mode for the admin dashboard.
        </p>
        <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {isDark ? 'Darker interface for low-light environments' : 'Brighter interface for well-lit environments'}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* ── Public Page Visibility ──────────────────────────────────── */}
      {canCleanup && (
        <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Public Page Visibility</h2>
            {flagsSaving && (
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Saving…</span>
            )}
          </div>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Control which public-facing pages are visible to website visitors. Disabled pages show a "coming soon" message.
          </p>

          {flagsMsg && (
            <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${
              flagsMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {flagsMsg.text}
            </div>
          )}

          {flagsLoading ? (
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading…</div>
          ) : (
            <div className="space-y-4">
              {/* Customers page toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Customer Stories Page</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Show illustrative customer stories at <span className="font-mono">/customers</span>
                  </p>
                </div>
                <button
                  onClick={() => saveFlags({ customersPageEnabled: !flags.customersPageEnabled })}
                  disabled={flagsSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                    flags.customersPageEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      flags.customersPageEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Changelog page toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Changelog Page</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Show product changelog at <span className="font-mono">/changelog</span>
                  </p>
                </div>
                <button
                  onClick={() => saveFlags({ changelogEnabled: !flags.changelogEnabled })}
                  disabled={flagsSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                    flags.changelogEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      flags.changelogEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Changelog announcement note */}
              {flags.changelogEnabled && (
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Changelog Announcement Banner (optional)
                  </label>
                  <textarea
                    value={flags.changelogNote}
                    onChange={e => setFlags(f => ({ ...f, changelogNote: e.target.value }))}
                    onBlur={() => saveFlags({ changelogNote: flags.changelogNote })}
                    placeholder="e.g. 🎉 Version 2.5 is here! Check out the new IoT sensor dashboard."
                    rows={2}
                    className="w-full text-sm px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    This text appears as a banner on the changelog page to highlight the latest update.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Integrations ────────────────────────────────────────────── */}
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Integrations</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          Connect Sentinel with your existing tools and workflows.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Slack */}
            <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg" style={{ background: 'var(--bg-secondary)', color: '#4A154B' }}>S</div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Slack</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Team notifications</p>
                </div>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Inactive</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Send alerts and work order updates directly to Slack channels.</p>
              <a href="/settings/integrations" className="text-xs font-medium text-blue-500 hover:underline mt-auto">Configure →</a>
            </div>
            {/* SMS / Twilio */}
            <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg" style={{ background: 'var(--bg-secondary)', color: '#F22F46' }}>T</div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>SMS / Twilio</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Text message alerts</p>
                </div>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Inactive</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Receive critical machine alerts via SMS using Twilio.</p>
              <a href="/settings/integrations" className="text-xs font-medium text-blue-500 hover:underline mt-auto">Configure →</a>
            </div>
            {/* Zapier */}
            <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg" style={{ background: 'var(--bg-secondary)', color: '#FF4A00' }}>Z</div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Zapier</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Workflow automation</p>
                </div>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Inactive</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Automate workflows by connecting Sentinel to 5,000+ apps.</p>
              <a href="/settings/integrations" className="text-xs font-medium text-blue-500 hover:underline mt-auto">Configure →</a>
            </div>
            {/* QuickBooks */}
            <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg" style={{ background: 'var(--bg-secondary)', color: '#2CA01C' }}>Q</div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>QuickBooks</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Accounting sync</p>
                </div>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Inactive</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sync maintenance costs and work orders with QuickBooks.</p>
              <a href="/settings/integrations" className="text-xs font-medium text-blue-500 hover:underline mt-auto">Configure →</a>
            </div>
            {/* Google Sheets */}
            <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg" style={{ background: 'var(--bg-secondary)', color: '#0F9D58' }}>G</div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Google Sheets</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Data export</p>
                </div>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Inactive</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Export machine data and reports to Google Sheets automatically.</p>
              <a href="/settings/integrations" className="text-xs font-medium text-blue-500 hover:underline mt-auto">Configure →</a>
            </div>
            {/* Webhooks */}
            <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg" style={{ background: 'var(--bg-secondary)', color: '#6366f1' }}>W</div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Webhooks</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Custom HTTP events</p>
                </div>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Inactive</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Send real-time event data to any endpoint via HTTP webhooks.</p>
              <a href="/settings/integrations" className="text-xs font-medium text-blue-500 hover:underline mt-auto">Configure →</a>
            </div>
          </div>
          <div className="pt-2">
            <a href="/settings/integrations" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--accent-blue)' }}>
              Manage All Integrations →
            </a>
          </div>
        </div>

      {/* ── Data Management ────────────────────────────────────────── */}
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Data Management</h2>

        {!canCleanup && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Only organization owners and admins can manage data.
          </p>
        )}

        {canCleanup && (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Clear all machines, work orders, alerts, and maintenance tasks from your organization.
              This action cannot be undone.
            </p>

            {message && (
              <div className={`p-4 rounded-lg mb-4 text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {message.text}
              </div>
            )}

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!hasData}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
                style={hasData ? { background: 'rgb(239 68 68 / 0.1)', color: 'rgb(239 68 68)', border: '1px solid rgb(239 68 68 / 0.2)' } : { background: 'var(--bg-surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                {hasData ? 'Clear All Data' : 'No Data to Clear'}
              </button>
            ) : (
              <div className="p-4 rounded-lg" style={{ background: 'rgb(239 68 68 / 0.05)', border: '1px solid rgb(239 68 68 / 0.2)' }}>
                <p className="text-sm font-medium mb-3" style={{ color: 'rgb(239 68 68)' }}>
                  Are you sure? This will permanently delete all your organization's data.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCleanup}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50"
                    style={{ background: 'rgb(239 68 68)' }}
                  >
                    {isDeleting ? 'Deleting…' : 'Yes, Delete Everything'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}