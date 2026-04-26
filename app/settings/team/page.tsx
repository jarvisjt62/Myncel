'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

  useEffect(() => {
    fetchTeam();
  }, []);

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
      if (res.ok) {
        setInviteEmail('');
        fetchTeam();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send invite');
      }
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
      if (res.ok) {
        fetchTeam();
      }
    } catch (e) {
      console.error('Failed to update role:', e);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const res = await fetch(`/api/team/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchTeam();
      }
    } catch (e) {
      console.error('Failed to remove member:', e);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-100 text-purple-700';
      case 'ADMIN': return 'bg-blue-100 text-blue-700';
      case 'TECHNICIAN': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center">
        <div className="text-[#425466]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e6ebf1]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-[#0a2540]">Team</h1>
          <p className="text-[#425466] mt-1">Manage your team members and their permissions</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-1">
            <Link href="/settings" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Profile
            </Link>
            <Link href="/settings/security" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Security
            </Link>
            <Link href="/settings/team" className="block px-4 py-3 rounded-lg bg-[#635bff] text-white font-medium">
              Team
            </Link>
            <Link href="/settings/notifications" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Notifications
            </Link>
            <Link href="/settings/integrations" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Integrations
            </Link>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-6">
            {/* Invite Form */}
            <div className="bg-white rounded-xl border border-[#e6ebf1] p-6">
              <h2 className="text-lg font-semibold text-[#0a2540] mb-4">Invite Team Member</h2>
              <form onSubmit={handleInvite} className="flex gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 border border-[#e6ebf1] rounded-lg px-4 py-2 text-sm"
                  required
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="border border-[#e6ebf1] rounded-lg px-4 py-2 text-sm"
                >
                  <option value="MEMBER">Member</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-6 py-2 bg-[#635bff] text-white rounded-lg font-medium hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
                >
                  {inviting ? 'Inviting...' : 'Invite'}
                </button>
              </form>
            </div>

            {/* Team Members */}
            <div className="bg-white rounded-xl border border-[#e6ebf1] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e6ebf1]">
                <h2 className="text-lg font-semibold text-[#0a2540]">Team Members ({members.length})</h2>
              </div>
              <div className="divide-y divide-[#e6ebf1]">
                {members.map((member) => (
                  <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#635bff] flex items-center justify-center text-white font-medium">
                        {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[#0a2540]">{member.name || 'Unnamed'}</div>
                        <div className="text-sm text-[#425466]">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        disabled={member.role === 'OWNER'}
                        className={`text-sm px-3 py-1 rounded-full border-0 ${getRoleBadgeColor(member.role)} ${member.role === 'OWNER' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <option value="OWNER">Owner</option>
                        <option value="ADMIN">Admin</option>
                        <option value="TECHNICIAN">Technician</option>
                        <option value="MEMBER">Member</option>
                      </select>
                      {member.role !== 'OWNER' && (
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="px-6 py-8 text-center text-[#425466]">
                    No team members found. Invite your first team member above.
                  </div>
                )}
              </div>
            </div>

            {/* Role Descriptions */}
            <div className="bg-white rounded-xl border border-[#e6ebf1] p-6">
              <h2 className="text-lg font-semibold text-[#0a2540] mb-4">Role Permissions</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 rounded-full ${getRoleBadgeColor('OWNER')}`}>Owner</span>
                  <span className="text-[#425466]">Full access to all features, billing, and team management. Cannot be removed.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 rounded-full ${getRoleBadgeColor('ADMIN')}`}>Admin</span>
                  <span className="text-[#425466]">Can manage machines, work orders, parts, and team members.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 rounded-full ${getRoleBadgeColor('TECHNICIAN')}`}>Technician</span>
                  <span className="text-[#425466]">Can view and update work orders, log maintenance, and update machine status.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 rounded-full ${getRoleBadgeColor('MEMBER')}`}>Member</span>
                  <span className="text-[#425466]">Can view machines and work orders. Limited edit permissions.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}