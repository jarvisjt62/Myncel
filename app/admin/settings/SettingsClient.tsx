'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme, ThemeToggle } from '../../components/ThemeProvider'

interface SettingsClientProps {
  organizationId: string
  canCleanup: boolean
  hasData: boolean
}

export default function SettingsClient({ organizationId, canCleanup, hasData }: SettingsClientProps) {
  const router = useRouter()
  const { theme, isDark } = useTheme()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  hasData
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                    : 'border text-sm cursor-not-allowed opacity-40'
                }`}
                style={!hasData ? { borderColor: 'var(--border)', color: 'var(--text-muted)' } : {}}
              >
                {hasData ? 'Clear All Data' : 'No Data to Clear'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm font-medium">Are you sure you want to delete all data?</p>
                  <p className="text-red-400/70 text-xs mt-1">
                    This will permanently delete all machines, work orders, alerts, and maintenance tasks.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCleanup}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete All Data'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
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