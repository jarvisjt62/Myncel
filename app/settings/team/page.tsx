'use client';

import { useState, useEffect } from 'react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  useEffect(() => { fetchTeam(); }, []);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (e) {
      console.error('Failed to fetch team:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) { setInviteEmail(''); fetchTeam(); }
      else { const data = await res.json(); alert(data.error || 'Failed to send invite'); }
    } catch (e) {
      console.error('Failed to invite:', e);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/team/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) fetchTeam();
    } catch (e) { console.error('Failed to update role:', e); }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      const res = await fetch(`/api/team/${userId}`, { method: 'DELETE' });
      if (res.ok) fetchTeam();
    } catch (e) { console.error('Failed to remove member:', e); }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':      return 'bg-purple-100 text-purple-700';
      case 'ADMIN':      return 'bg-blue-100 text-blue-700';
      case 'TECHNICIAN': return 'bg-emerald-100 text-emerald-700';
      default:           return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Team</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your team members and their permissions.</p>
      </div>

      {/* Invite Form */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Invite Team Member</h3>
        <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 min-w-[200px] rounded-lg px-4 py-2 text-sm focus:outline-none"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            required
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="rounded-lg px-4 py-2 text-sm focus:outline-none"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          >
            <option value="MEMBER">Member</option>
            <option value="TECHNICIAN">Technician</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="px-6 py-2 bg-[#635bff] text-white rounded-lg font-medium hover:bg-[#4f46e5] disabled:opacity-50 transition-colors text-sm"
          >
            {inviting ? 'Inviting...' : 'Invite'}
          </button>
        </form>
      </div>

      {/* Team Members List */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Team Members ({members.length})
          </h3>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {members.map(member => (
            <div key={member.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#635bff] flex items-center justify-center text-white font-medium text-sm">
                  {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{member.name || 'Unnamed'}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{member.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={member.role}
                  onChange={e => handleRoleChange(member.id, e.target.value)}
                  disabled={member.role === 'OWNER'}
                  className={`text-xs px-3 py-1 rounded-full ${getRoleBadgeColor(member.role)} ${member.role === 'OWNER' ? 'cursor-not-allowed' : 'cursor-pointer'} focus:outline-none`}
                  style={{ border: 'none' }}
                >
                  <option value="OWNER">Owner</option>
                  <option value="ADMIN">Admin</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="MEMBER">Member</option>
                </select>
                {member.role !== 'OWNER' && (
                  <button onClick={() => handleRemove(member.id)} className="text-xs text-red-500 hover:text-red-700">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="px-6 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              No team members found. Invite your first team member above.
            </div>
          )}
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Role Permissions</h3>
        <div className="space-y-3 text-sm">
          {[
            { role: 'OWNER',      desc: 'Full access to all features, billing, and team management. Cannot be removed.' },
            { role: 'ADMIN',      desc: 'Can manage machines, work orders, parts, and team members.' },
            { role: 'TECHNICIAN', desc: 'Can view and update work orders, log maintenance, and update machine status.' },
            { role: 'MEMBER',     desc: 'Can view machines and work orders. Limited edit permissions.' },
          ].map(item => (
            <div key={item.role} className="flex items-start gap-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getRoleBadgeColor(item.role)}`}>{item.role.charAt(0) + item.role.slice(1).toLowerCase()}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}