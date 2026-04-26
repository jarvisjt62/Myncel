'use client';
import { useState } from 'react';
import { signOut } from 'next-auth/react';

type Props = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    organization: { name: string; plan: string } | null;
  };
};

export default function AdminAccountClient({ user }: Props) {
  const [name, setName] = useState(user.name);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setProfileMsg({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Something went wrong.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordMsg({ type: 'error', text: 'New password must be different from your current password.' });
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: '✅ Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Something went wrong.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const pwStrength = (pw: string) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
    if (score === 3) return { label: 'Fair', color: 'bg-yellow-500', width: 'w-2/4' };
    if (score === 4) return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  };

  const strength = pwStrength(newPassword);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">My Account</h1>
        <p className="text-[#8892a4] mt-1">Manage your admin profile and security settings.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-[#0d1426] border border-[#1e2d4a] rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#1e2d4a]">
          <div className="w-16 h-16 rounded-full bg-[#635bff]/20 border-2 border-[#635bff]/40 flex items-center justify-center text-[#635bff] text-2xl font-bold flex-shrink-0">
            {name?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="text-white text-lg font-semibold">{name}</p>
            <p className="text-[#8892a4] text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-medium">{user.role}</span>
              {user.organization && (
                <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 rounded-full font-medium">{user.organization.plan}</span>
              )}
              <span className="text-xs bg-[#635bff]/20 text-[#635bff] border border-[#635bff]/30 px-2.5 py-0.5 rounded-full font-medium">SUPER ADMIN</span>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Account ID', value: user.id },
            { label: 'Organization', value: user.organization?.name || '—' },
            { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
            { label: 'Email', value: user.email },
          ].map(item => (
            <div key={item.label} className="bg-[#0a0f1e] rounded-lg p-3">
              <p className="text-[#8892a4] text-xs mb-1">{item.label}</p>
              <p className="text-white text-sm font-medium truncate">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Edit Profile */}
        <h3 className="text-white font-medium mb-3">Edit Profile</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-1.5">Display Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0a0f1e] border border-[#1e2d4a] rounded-lg text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-1.5">Email Address</label>
            <input
              value={user.email}
              disabled
              className="w-full px-3 py-2.5 bg-[#0a0f1e]/50 border border-[#1e2d4a] rounded-lg text-sm text-[#8892a4] cursor-not-allowed"
            />
            <p className="text-xs text-[#4a5568] mt-1">Email cannot be changed for security reasons.</p>
          </div>
          {profileMsg && (
            <div className={`text-sm px-3 py-2 rounded-lg ${profileMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {profileMsg.text}
            </div>
          )}
          <button
            onClick={handleProfileSave}
            disabled={profileSaving}
            className="bg-[#635bff] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#4f46e5] transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {profileSaving ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving...</>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-[#0d1426] border border-[#1e2d4a] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Change Password</h3>
            <p className="text-[#8892a4] text-xs">Keep your admin account secure</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-3 py-2.5 bg-[#0a0f1e] border border-[#1e2d4a] rounded-lg text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all pr-10"
              />
              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892a4] hover:text-white transition-colors">
                {showCurrentPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="w-full px-3 py-2.5 bg-[#0a0f1e] border border-[#1e2d4a] rounded-lg text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all pr-10"
              />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892a4] hover:text-white transition-colors">
                {showNewPw ? '🙈' : '👁️'}
              </button>
            </div>
            {strength && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-[#8892a4]">Password strength</p>
                  <p className={`text-xs font-medium ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                </div>
                <div className="h-1.5 bg-[#1e2d4a] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className={`w-full px-3 py-2.5 bg-[#0a0f1e] border rounded-lg text-sm text-white placeholder-[#4a5568] focus:outline-none focus:ring-2 transition-all pr-10 ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : confirmPassword && newPassword === confirmPassword
                    ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
                    : 'border-[#1e2d4a] focus:border-[#635bff] focus:ring-[#635bff]/20'
                }`}
              />
              <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892a4] hover:text-white transition-colors">
                {showConfirmPw ? '🙈' : '👁️'}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-emerald-400 mt-1">✓ Passwords match</p>
            )}
          </div>

          {passwordMsg && (
            <div className={`text-sm px-3 py-2.5 rounded-lg ${passwordMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {passwordMsg.text}
            </div>
          )}

          <button
            onClick={handlePasswordChange}
            disabled={passwordSaving}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {passwordSaving ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Changing...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg> Change Password</>
            )}
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-[#0d1426] border border-[#1e2d4a] rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Sign Out</h3>
            <p className="text-[#8892a4] text-sm mt-0.5">Sign out of your admin account on this device.</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/signin' })}
            className="border border-[#1e2d4a] text-[#8892a4] hover:text-white hover:border-[#635bff] px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-red-400 font-semibold">Danger Zone</h3>
            <p className="text-[#8892a4] text-xs">These actions are irreversible. Proceed with caution.</p>
          </div>
        </div>
        <p className="text-[#8892a4] text-sm mb-4">Deleting the admin account will remove all associated data and cannot be undone.</p>
        <button className="border border-red-500/30 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm font-medium transition-all">
          Delete Admin Account
        </button>
      </div>
    </div>
  );
}