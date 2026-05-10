import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Gateway Services — Myncel Admin' };

function isOnline(lastSeenAt: Date | string | null) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000;
}

function connectorFromName(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('opc')) return 'OPC UA';
  if (lower.includes('mqtt') || lower.includes('esp32')) return 'MQTT';
  if (lower.includes('modbus')) return 'Modbus';
  if (lower.includes('bacnet')) return 'BACnet/IP';
  if (lower.includes('s7') || lower.includes('siemens')) return 'Siemens S7';
  if (lower.includes('rockwell') || lower.includes('ethernet')) return 'Rockwell EtherNet/IP';
  if (lower.includes('beckhoff') || lower.includes('ads')) return 'Beckhoff ADS';
  if (lower.includes('mtconnect') || lower.includes('cnc')) return 'MTConnect';
  return 'Gateway agent';
}

export default async function AdminEdgeGatewayPage() {
  const tokens = await db.machineDeviceToken.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      tokenPrefix: true,
      isActive: true,
      lastSeenAt: true,
      createdAt: true,
      revokedAt: true,
      machine: { select: { id: true, name: true, organization: { select: { name: true } } } },
    },
  });

  const active = tokens.filter(t => t.isActive).length;
  const online = tokens.filter(t => t.isActive && isOnline(t.lastSeenAt)).length;
  const offline = tokens.filter(t => t.isActive && !isOnline(t.lastSeenAt)).length;
  const revoked = tokens.filter(t => !t.isActive).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gateway Services</h1>
          <p className="mt-1 text-sm text-[#8892a4]">Monitor edge gateway tokens, last-seen health, connector types, and deployment downloads across all organizations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/docs/edge-gateway" className="rounded-lg border border-[#635bff]/40 px-3 py-2 text-sm font-semibold text-[#a7a1ff] hover:bg-[#635bff]/10">Docs</Link>
          <a href="/api/edge-gateway/download/package" className="rounded-lg bg-[#635bff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5]">Download package</a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Active gateways', active, 'text-white'],
          ['Online', online, 'text-emerald-400'],
          ['Offline', offline, 'text-amber-400'],
          ['Revoked', revoked, 'text-red-400'],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-[#1e2d4a] bg-[#0d1426] p-4">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="mt-1 text-sm text-[#8892a4]">{label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#1e2d4a] bg-[#0d1426]">
        <div className="border-b border-[#1e2d4a] p-4">
          <h2 className="font-bold text-white">Gateway status table</h2>
          <p className="mt-1 text-xs text-[#8892a4]">Readings count is displayed as 0 until a persisted telemetry-count aggregate is added.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-[#101a30] text-xs uppercase tracking-wider text-[#8892a4]">
              <tr>
                <th className="px-4 py-3 text-left">Gateway</th>
                <th className="px-4 py-3 text-left">Organization</th>
                <th className="px-4 py-3 text-left">Machine</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last seen</th>
                <th className="px-4 py-3 text-left">Connector type</th>
                <th className="px-4 py-3 text-left">Readings count</th>
                <th className="px-4 py-3 text-left">Token</th>
              </tr>
            </thead>
            <tbody>
              {tokens.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#8892a4]">No gateway tokens have been created yet.</td></tr>
              ) : tokens.map(token => (
                <tr key={token.id} className="border-t border-[#1e2d4a]">
                  <td className="px-4 py-3 font-semibold text-white">{token.name}</td>
                  <td className="px-4 py-3 text-[#c8d3e8]">{token.machine?.organization?.name || '—'}</td>
                  <td className="px-4 py-3 text-[#c8d3e8]">
                    <Link href={`/admin/machines?machineId=${token.machine?.id}`} className="text-[#a7a1ff] hover:underline">{token.machine?.name || '—'}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${token.isActive && isOnline(token.lastSeenAt) ? 'bg-emerald-500/15 text-emerald-300' : token.isActive ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300'}`}>
                      {token.isActive && isOnline(token.lastSeenAt) ? 'online' : token.isActive ? 'offline' : 'revoked'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#c8d3e8]">{token.lastSeenAt ? new Date(token.lastSeenAt).toLocaleString() : 'Never'}</td>
                  <td className="px-4 py-3 text-[#c8d3e8]">{connectorFromName(token.name)}</td>
                  <td className="px-4 py-3 text-[#c8d3e8]">0</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#8892a4]">{token.tokenPrefix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {[
          ['Edge gateway package', '/api/edge-gateway/download/package'],
          ['ESP32 sketch', '/api/edge-gateway/download/esp32'],
          ['Raspberry Pi agent', '/api/edge-gateway/download/raspberry-pi'],
          ['Node-RED flow', '/api/edge-gateway/download/node-red'],
          ['Example YAML config', '/api/edge-gateway/download/example-yaml'],
        ].map(([label, href]) => (
          <a key={href} href={href} className="rounded-xl border border-[#1e2d4a] bg-[#0d1426] p-4 text-sm font-semibold text-white hover:border-[#635bff]">⬇️ {label}</a>
        ))}
      </div>
    </div>
  );
}
