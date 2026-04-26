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
        if (data.enabled) {
          setError('Two-factor authentication is already enabled.');
          return;
        }
        setTwoFASecret(data.secret);
        setTwoFAUri(data.uri);
        setBackupCodes(data.backupCodes);
        setShow2FASetup(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to start 2FA setup');
      }
    } catch (err) {
      setError('Failed to start 2FA setup');
    }
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
    } catch (err) {
      setError('Failed to verify 2FA code');
    }
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
    } catch (err) {
      setError('Failed to disable 2FA');
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const res = await fetch('/api/user/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        setSuccess('Session revoked successfully.');
        loadSecurityInfo();
      }
    } catch (err) {
      setError('Failed to revoke session');
    }
  };

  const revokeAllOtherSessions = async () => {
    try {
      const res = await fetch('/api/user/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokeAll: true }),
      });
      if (res.ok) {
        setSuccess('All other sessions revoked successfully.');
        loadSecurityInfo();
      }
    } catch (err) {
      setError('Failed to revoke sessions');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account security and active sessions.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
        )}

        {/* Two-Factor Authentication */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Two-Factor Authentication</h2>
          
          {!show2FASetup ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">
                  Status: <span className={twoFactorEnabled ? 'text-green-600 font-medium' : 'text-gray-500'}>
                    {twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account.</p>
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
                className={`px-4 py-2 rounded-lg font-medium ${
                  twoFactorEnabled
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                <strong>Important:</strong> Save your backup codes securely.
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">1. Scan QR code with your authenticator app or enter manually:</p>
                <p className="font-mono text-sm bg-white p-3 rounded border">{twoFASecret}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">2. Save these backup codes:</p>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="bg-white px-3 py-2 rounded font-mono text-sm">{code}</div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">3. Enter the verification code:</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="px-4 py-2 border rounded-lg text-center font-mono text-lg w-32"
                  />
                  <button onClick={verify2FASetup} disabled={verificationCode.length !== 6}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium disabled:opacity-50">
                    Verify
                  </button>
                  <button onClick={() => setShow2FASetup(false)} className="px-4 py-2 bg-gray-100 rounded-lg">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Active Sessions</h2>
            {sessions.length > 1 && (
              <button onClick={revokeAllOtherSessions}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                Sign out other sessions
              </button>
            )}
          </div>

          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id}
                className={`p-4 rounded-lg border ${s.isCurrent ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{s.deviceName}</span>
                      {s.isCurrent && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">Current</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">IP: {s.ipAddress} • Last active: {new Date(s.lastActivity).toLocaleString()}</div>
                  </div>
                  {!s.isCurrent && (
                    <button onClick={() => revokeSession(s.id)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}