'use client';

import { useState } from 'react';
import Link from 'next/link';
import SensorSimulator from '@/app/components/dashboard/SensorSimulator';

interface Machine {
  id: string;
  name: string;
  category: string;
  status: string;
}

interface Organization {
  id: string;
  name: string;
  machines: Machine[];
}

export default function AdminIoTSimulatorClient({ organizations }: { organizations: Organization[] }) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [adminMode, setAdminMode] = useState<'select' | 'simulate'>('select');

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);

  if (adminMode === 'simulate' && selectedOrg) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setAdminMode('select')}
            className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            ← Back to Organization Select
          </button>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Simulating: {selectedOrg.name}
          </span>
        </div>

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              IoT Sensor Simulator
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Simulating sensors for <strong>{selectedOrg.name}</strong> — generate realistic readings to test monitoring
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ backgroundColor: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
            Admin · Simulation Mode
          </div>
        </div>

        <SensorSimulator />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            IoT Sensor Simulator
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Select an organization to simulate IoT sensors for their machines.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-semibold"
          style={{ backgroundColor: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.25)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
          Admin Mode
        </div>
      </div>

      {/* Info row */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: '⚡', title: 'No hardware needed', desc: 'Simulate any sensor type instantly' },
          { icon: '🚨', title: 'Triggers real alerts', desc: 'Alerts fire when thresholds are crossed' },
          { icon: '📊', title: 'Populates charts', desc: 'Data appears on live dashboards' },
        ].map(item => (
          <div key={item.title} className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <span className="text-lg">{item.icon}</span>
            <div>
              <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Organization selector dropdown */}
      <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          🏢 Select Organization
        </h2>

        {organizations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No organizations found.</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Organization
              </label>
              <select
                value={selectedOrgId}
                onChange={e => setSelectedOrgId(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#635bff]/40 transition-all appearance-none"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '36px',
                }}
              >
                <option value="">— Choose an organization —</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.machines.length} machine{org.machines.length !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>

            {selectedOrg && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedOrg.machines.length}</span>{' '}
                  machine{selectedOrg.machines.length !== 1 ? 's' : ''} available
                </div>
                <button
                  onClick={() => setAdminMode('simulate')}
                  disabled={selectedOrg.machines.length === 0}
                  className="px-4 py-2.5 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
                  style={{
                    backgroundColor: selectedOrg.machines.length > 0 ? '#635bff' : 'var(--bg-surface-2)',
                    color: selectedOrg.machines.length > 0 ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    cursor: selectedOrg.machines.length > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  Start Simulation →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/docs/iot-guides"
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
          style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          📡 Wiring Guides
        </Link>
        <Link
          href="/admin/api-keys"
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
          style={{ color: '#635bff', backgroundColor: 'rgba(99,91,255,0.08)', border: '1px solid rgba(99,91,255,0.25)' }}
        >
          🔑 API Keys
        </Link>
      </div>
    </div>
  );
}