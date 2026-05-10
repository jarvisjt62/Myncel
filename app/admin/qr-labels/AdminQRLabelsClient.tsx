'use client';

import { useState } from 'react';
import QRLabelsClient from '@/app/equipment/qr-labels/QRLabelsClient';

interface Machine {
  id: string;
  name: string;
  serialNumber: string | null;
  category: string;
  status: string;
  location: string | null;
  manufacturer: string | null;
  model: string | null;
}

interface Organization {
  id: string;
  name: string;
  machines: Machine[];
}

export default function AdminQRLabelsClient({ organizations }: { organizations: Organization[] }) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            QR Label Generator
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Select an organization to view and print QR labels for their machines.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-semibold"
          style={{ backgroundColor: 'rgba(99,91,255,0.08)', color: '#635bff', border: '1px solid rgba(99,91,255,0.25)' }}>
          Admin Mode
        </div>
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
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedOrg.machines.length}</span>{' '}
                machine{selectedOrg.machines.length !== 1 ? 's' : ''} available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Show QR labels for selected org */}
      {selectedOrg ? (
        <QRLabelsClient machines={selectedOrg.machines} />
      ) : (
        <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <span className="text-4xl">🏷️</span>
          <p className="mt-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Select an organization above to view their QR labels
          </p>
        </div>
      )}
    </div>
  );
}