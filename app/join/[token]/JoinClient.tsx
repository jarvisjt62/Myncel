'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

interface InviteInfo {
  valid: boolean;
  email: string;
  role: string;
  organization: { name: string; industry: string };
  invitedBy: { name: string; email: string };
  expires: string;
}

const ROLE_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  TECHNICIAN: { label: 'Technician', icon: '🔧', desc: 'View and complete assigned maintenance tasks' },
  ADMIN:      { label: 'Admin',      icon: '⚙️', desc: 'Manage team, machines, and work orders'      },
  MEMBER:     { label: 'Member',     icon: '👤', desc: 'View dashboards and reports'                 },
  OWNER:      { label: 'Owner',      icon: '🏢', desc: 'Full access to all organization features'    },
};

export default function JoinClient({ token }: { token: string }) {
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'submitting' | 'success'>('loading');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    fetch(`/api/team/join?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.valid) {
          setInvite(data);
          setStatus('valid');
        } else {
          setTokenError(data.error || 'Invalid invitation');
          setStatus('invalid');
        }
      })
      .catch(() => {
        setTokenError('Failed to load invitation. Please try again.');
        setStatus('invalid');
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.name.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setStatus('submitting');

    try {
      const res = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: form.name.trim(), password: form.password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setStatus('valid');
        return;
      }

      setStatus('success');

      // Auto sign in after a short delay
      setTimeout(async () => {
        await signIn('credentials', {
          email: invite?.email,
          password: form.password,
          callbackUrl: '/dashboard',
        });
      }, 1500);
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('valid');
    }
  };

  const roleInfo = invite ? (ROLE_LABELS[invite.role] ?? ROLE_LABELS['MEMBER']) : null;

  // ── Loading ──
  if (status === 'loading') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={styles.spinner} />
            <p style={{ color: '#8898aa', marginTop: 16, fontSize: 14 }}>Validating your invitation…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Invalid / expired ──
  if (status === 'invalid') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⛔</div>
            <h2 style={{ color: '#0a2540', margin: '0 0 8px', fontSize: 22 }}>Invitation Not Valid</h2>
            <p style={{ color: '#425466', fontSize: 15, maxWidth: 380, margin: '0 auto 24px' }}>{tokenError}</p>
            <Link href="/signin" style={styles.btnPrimary}>Go to Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (status === 'success') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h1 style={styles.headerTitle}>Welcome to the team!</h1>
            <p style={styles.headerSub}>Account created. Signing you in…</p>
          </div>
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={styles.spinner} />
            <p style={{ color: '#8898aa', marginTop: 16, fontSize: 14 }}>
              Redirecting to your dashboard…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <img src="/logo.png" alt="Myncel" style={{ width: 44, height: 44, marginBottom: 12 }} />
          <h1 style={styles.headerTitle}>You're Invited!</h1>
          <p style={styles.headerSub}>
            <strong>{invite?.invitedBy.name || 'Your manager'}</strong> invited you to join{' '}
            <strong>{invite?.organization.name}</strong>
          </p>
        </div>

        {/* Role + Org Info */}
        <div style={styles.inviteInfo}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Organization</span>
            <span style={styles.infoValue}>{invite?.organization.name}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Your Role</span>
            <span style={styles.roleBadge}>
              {roleInfo?.icon} {roleInfo?.label}
            </span>
          </div>
          <div style={{ ...styles.infoRow, border: 'none', paddingBottom: 0 }}>
            <span style={styles.infoLabel}>Email</span>
            <span style={styles.infoValue}>{invite?.email}</span>
          </div>
        </div>

        {/* Role description */}
        {roleInfo && (
          <div style={styles.roleDesc}>
            <span style={{ fontSize: 13 }}>ℹ️</span>
            <span style={{ fontSize: 13, color: '#425466' }}>{roleInfo.desc}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Your Full Name</label>
            <input
              type="text"
              placeholder="e.g. John Smith"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              style={styles.input}
              autoFocus
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={invite?.email || ''}
              disabled
              style={{ ...styles.input, background: '#f6f9fc', color: '#8898aa', cursor: 'not-allowed' }}
            />
            <p style={styles.fieldHint}>This email was specified in your invitation</p>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Create a Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                style={{ ...styles.input, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {form.password.length > 0 && (
              <PasswordStrength password={form.password} />
            )}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              required
              style={{
                ...styles.input,
                borderColor: form.confirmPassword && form.confirmPassword !== form.password
                  ? '#ef4444' : undefined,
              }}
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            style={{
              ...styles.btnPrimary,
              width: '100%',
              opacity: status === 'submitting' ? 0.7 : 1,
              cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'submitting' ? 'Creating Account…' : '🚀 Join Team & Get Started'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#8898aa', margin: '16px 0 0' }}>
            Already have an account?{' '}
            <Link href="/signin" style={{ color: '#635bff', fontWeight: 600 }}>Sign in instead</Link>
          </p>
        </form>
      </div>

      {/* Footer */}
      <p style={{ textAlign: 'center', fontSize: 12, color: '#8898aa', marginTop: 24 }}>
        Invitation expires{' '}
        {invite?.expires
          ? new Date(invite.expires).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : 'soon'}
        . By joining, you agree to Myncel's{' '}
        <Link href="/terms" style={{ color: '#635bff' }}>Terms of Service</Link>.
      </p>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#635bff', '#10b981'];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 999,
              background: i <= score ? colors[score] : '#e6ebf1',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 11, margin: 0, color: colors[score] || '#8898aa' }}>
        {score > 0 ? labels[score] : ''}
        {score < 3 && password.length > 0 ? ' — add uppercase, numbers, or symbols' : ''}
      </p>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: '#ffffff',
    borderRadius: 20,
    boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)',
    padding: '36px 32px',
    textAlign: 'center' as const,
  },
  headerTitle: {
    color: '#ffffff',
    margin: '0 0 6px',
    fontSize: 26,
    fontWeight: 700,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.85)',
    margin: 0,
    fontSize: 15,
  },
  inviteInfo: {
    margin: '20px 24px 0',
    background: '#f6f9fc',
    borderRadius: 12,
    padding: '4px 16px',
    border: '1px solid #e6ebf1',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #e6ebf1',
  },
  infoLabel: {
    fontSize: 13,
    color: '#8898aa',
    fontWeight: 500,
  },
  infoValue: {
    fontSize: 14,
    color: '#0a2540',
    fontWeight: 600,
  },
  roleBadge: {
    fontSize: 13,
    fontWeight: 700,
    background: 'rgba(99,91,255,0.1)',
    color: '#635bff',
    border: '1px solid rgba(99,91,255,0.3)',
    padding: '3px 10px',
    borderRadius: 999,
  },
  roleDesc: {
    margin: '12px 24px 0',
    background: 'rgba(99,91,255,0.06)',
    border: '1px solid rgba(99,91,255,0.15)',
    borderRadius: 10,
    padding: '10px 14px',
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  },
  form: {
    padding: '24px',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#0a2540',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #e6ebf1',
    borderRadius: 10,
    fontSize: 14,
    color: '#0a2540',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  },
  fieldHint: {
    fontSize: 11,
    color: '#8898aa',
    margin: '4px 0 0',
  },
  eyeBtn: {
    position: 'absolute' as const,
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: 0,
  },
  errorBox: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#b91c1c',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  btnPrimary: {
    display: 'inline-block',
    background: '#635bff',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    padding: '13px 24px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center' as const,
    transition: 'background 0.2s',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e6ebf1',
    borderTop: '3px solid #635bff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
};