import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SensorSimulator from '@/app/components/dashboard/SensorSimulator';

export const metadata = {
  title: 'IoT Simulator — Myncel Admin',
};

export default async function AdminIoTSimulatorPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            IoT Sensor Simulator
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Generate realistic sensor readings to test your monitoring setup — no physical hardware required.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-semibold"
          style={{ backgroundColor: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.25)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
          Simulation Mode
        </div>
      </div>

      {/* Info row */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: '⚡', title: 'No hardware needed', desc: 'Simulate any sensor type instantly' },
          { icon: '🚨', title: 'Triggers real alerts', desc: 'Alerts fire when thresholds are crossed' },
          { icon: '📊', title: 'Populates charts', desc: 'Data appears on your live dashboard' },
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

      {/* Quick links */}
      <div className="flex items-center gap-3 mb-6">
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

      {/* Simulator component */}
      <SensorSimulator />
    </div>
  );
}