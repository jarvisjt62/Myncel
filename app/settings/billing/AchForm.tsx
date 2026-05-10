'use client';

import { useState } from 'react';

interface AchFormProps {
  onSubmit: (data: {
    accountHolderName: string;
    routingNumber: string;
    accountNumber: string;
    accountType: 'checking' | 'savings';
  }) => void;
  onBack: () => void;
  loading: boolean;
}

export default function AchForm({ onSubmit, onBack, loading }: AchFormProps) {
  const [form, setForm] = useState({
    accountHolderName: '',
    routingNumber: '',
    accountNumber: '',
    confirmAccountNumber: '',
    accountType: 'checking' as 'checking' | 'savings',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.accountHolderName.trim()) {
      setError('Account holder name is required');
      return;
    }
    if (form.routingNumber.length !== 9) {
      setError('Routing number must be exactly 9 digits');
      return;
    }
    if (form.accountNumber.length < 4) {
      setError('Account number must be at least 4 digits');
      return;
    }
    if (form.accountNumber !== form.confirmAccountNumber) {
      setError('Account numbers do not match');
      return;
    }

    onSubmit({
      accountHolderName: form.accountHolderName.trim(),
      routingNumber: form.routingNumber,
      accountNumber: form.accountNumber,
      accountType: form.accountType,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: 'var(--text-secondary)', marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Back link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Choose Payment Method</span>
      </div>

      {/* ACH header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#10b98120', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏦</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Bank Transfer (ACH)</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Direct debit from your US bank account — 3–5 business days</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</div>
      )}

      {/* Form fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Account Holder Name</label>
          <input
            type="text"
            value={form.accountHolderName}
            onChange={e => setForm(f => ({ ...f, accountHolderName: e.target.value }))}
            placeholder="John Smith"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Routing Number</label>
          <input
            type="text"
            value={form.routingNumber}
            onChange={e => setForm(f => ({ ...f, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
            placeholder="9 digits"
            maxLength={9}
            style={{ ...inputStyle, fontFamily: 'monospace' }}
          />
        </div>
        <div>
          <label style={labelStyle}>Account Number</label>
          <input
            type="text"
            value={form.accountNumber}
            onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 17) }))}
            placeholder="Up to 17 digits"
            maxLength={17}
            style={{ ...inputStyle, fontFamily: 'monospace' }}
          />
        </div>
        <div>
          <label style={labelStyle}>Confirm Account Number</label>
          <input
            type="text"
            value={form.confirmAccountNumber}
            onChange={e => setForm(f => ({ ...f, confirmAccountNumber: e.target.value.replace(/\D/g, '').slice(0, 17) }))}
            placeholder="Re-enter account number"
            maxLength={17}
            style={{ ...inputStyle, fontFamily: 'monospace' }}
          />
        </div>
        <div>
          <label style={labelStyle}>Account Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['checking', 'savings'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(f => ({ ...f, accountType: t }))}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 8,
                  border: form.accountType === t ? '2px solid #10b981' : '1px solid var(--border)',
                  background: form.accountType === t ? '#10b9810d' : 'var(--bg-surface-2)',
                  color: form.accountType === t ? '#10b981' : 'var(--text-secondary)',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
                }}
              >{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Security note */}
      <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>🔒</span>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Your bank details are encrypted and stored securely. ACH debit authorization will be initiated for recurring payments.</span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >Cancel</button>
        <button
          type="submit"
          disabled={loading}
          style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', background: loading ? '#6ee7b7' : '#10b981', color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          {loading ? (
            <><span className="animate-spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Processing...</>
          ) : 'Authorize ACH Debit →'}
        </button>
      </div>
    </form>
  );
}