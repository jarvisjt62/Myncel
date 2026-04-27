'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SessionInfo {
  id: string;
  deviceName: string;
  ipAddress: string;
  lastActivity: string;
  isCurrent: boolean;
}

export default function SecuritySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState<string>('');
  const [twoFAUri, setTwoFAUri] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (session) {
      loadSecurityInfo();
    }
  }, [session, status, router]);

  const loadSecurityInfo = async () => {
    try {
      setLoading(true);
      const sessionsRes = await fetch('/api/user/sessions');
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions);
      }
      if (session?.user) {
        setTwoFactorEnabled((session.user as any).twoFactorEnabled || false);
      }
    } catch (err) {
      console.error('Failed to load security info:', err);
    } finally {
      setLoading(false);
    }
  };

  const start2FASetup = async () => {
    try {
      setError('');
      const res = await fetch('/api/user/2fa/setup');
      if (res.ok) {
        const data = await res.json();
        if (data.enabled) { setError('Two-factor authentication is already enabled.'); return; }
        setTwoFASecret(data.secret);
        setTwoFAUri(data.uri);
        setBackupCodes(data.backupCodes);
        setShow2FASetup(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to start 2FA setup');
      }
    } catch { setError('Failed to start 2FA setup'); }
  };

  const verify2FASetup = async () => {
    try {
      setError('');
      const res = await fetch('/api/user/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });
      if (res.ok) {
        setSuccess('Two-factor authentication enabled successfully!');
        setTwoFactorEnabled(true);
        setShow2FASetup(false);
        setVerificationCode('');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid verification code');
      }
    } catch { setError('Failed to verify 2FA code'); }
  };

  const disable2FA = async (code: string) => {
    try {
      setError('');
      const res = await fetch('/api/user/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        setSuccess('Two-factor authentication disabled.');
        setTwoFactorEnabled(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to disable 2FA');
      }
    } catch { setError('Failed to disable 2FA'); }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const res = await fetch('/api/user/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) { setSuccess('Session revoked successfully.'); loadSecurityInfo(); }
    } catch { setError('Failed to revoke session'); }
  };

  const revokeAllOtherSessions = async () => {
    try {
      const res = await fetch('/api/user/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokeAll: true }),
      });
      if (res.ok) { setSuccess('All other sessions revoked successfully.'); loadSecurityInfo(); }
    } catch { setError('Failed to revoke sessions'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Security Settings</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your account security and active sessions.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      {/* Two-Factor Authentication */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication</h3>

        {!show2FASetup ? (
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Status:{' '}
                <span className={twoFactorEnabled ? 'text-green-600 font-medium' : 'text-[var(--text-muted)]'}>
                  {twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                </span>
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add an extra layer of security to your account.</p>
            </div>
            <button
              onClick={() => {
                if (twoFactorEnabled) {
                  const code = prompt('Enter your 2FA code or backup code to disable:');
                  if (code) disable2FA(code);
                } else {
                  start2FASetup();
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                twoFactorEnabled
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-[#635bff] text-white hover:bg-[#4f46e5]'
              }`}
            >
              {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
              <strong>Important:</strong> Save your backup codes securely before continuing.
            </div>
            <div className="rounded-lg p-4" style={{ background: 'var(--bg-surface-2)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>1. Scan QR code or enter manually:</p>
              <p className="font-mono text-sm rounded border p-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>{twoFASecret}</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'var(--bg-surface-2)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>2. Save these backup codes:</p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <div key={i} className="rounded font-mono text-sm px-3 py-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>{code}</div>
                ))}
              </div>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'var(--bg-surface-2)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>3. Enter the verification code:</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="px-4 py-2 rounded-lg text-center font-mono text-lg w-32 focus:outline-none"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
                <button onClick={verify2FASetup} disabled={verificationCode.length !== 6}
                  className="px-4 py-2 bg-[#635bff] text-white rounded-lg font-medium disabled:opacity-50 text-sm">
                  Verify
                </button>
                <button onClick={() => setShow2FASetup(false)}
                  className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Active Sessions</h3>
          {sessions.length > 1 && (
            <button onClick={revokeAllOtherSessions}
              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium">
              Sign out other sessions
            </button>
          )}
        </div>
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No active sessions found.</p>
          ) : sessions.map(s => (
            <div key={s.id}
              className="p-4 rounded-lg border"
              style={s.isCurrent
                ? { borderColor: '#635bff', background: 'rgba(99,91,255,0.06)' }
                : { borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }
              }>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{s.deviceName}</span>
                    {s.isCurrent && <span className="px-2 py-0.5 bg-[#635bff] text-white text-xs rounded-full">Current</span>}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    IP: {s.ipAddress} · Last active: {new Date(s.lastActivity).toLocaleString()}
                  </div>
                </div>
                {!s.isCurrent && (
                  <button onClick={() => revokeSession(s.id)}
                    className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg">
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}