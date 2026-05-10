import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import GatewayConfigGenerator from '@/app/components/GatewayConfigGenerator';
import PlanGate from '@/app/components/PlanGate';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gateway Setup — Myncel',
  robots: { index: false },
};

const downloads = [
  ['Edge gateway package', '/api/edge-gateway/download/package'],
  ['ESP32 sketch', '/api/edge-gateway/download/esp32'],
  ['Raspberry Pi agent', '/api/edge-gateway/download/raspberry-pi'],
  ['Node-RED flow', '/api/edge-gateway/download/node-red'],
  ['Example YAML config', '/api/edge-gateway/download/example-yaml'],
];

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

export default async function GatewaySetupPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/signin');
  if (!session.user.organizationId) redirect('/onboarding');

  const machines = await db.machine.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      location: true,
      machineDeviceTokens: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, tokenPrefix: true, isActive: true, lastSeenAt: true, createdAt: true, revokedAt: true },
      },
    },
  });

  const firstMachine = machines[0];
  const tokens = machines.flatMap(machine => machine.machineDeviceTokens.map(token => ({ ...token, machineName: machine.name, machineId: machine.id })));

  return (
    <PlanGate featureKey="feature.iot.sensors" featureName="Gateway Setup" requiredPlan="GROWTH">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Gateway Setup</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Configure edge gateways for Modbus, OPC UA, MQTT, CNC, PLC, ESP32, Raspberry Pi, and Node-RED telemetry.</p>
          </div>
          <Link href="/docs/edge-gateway" className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ color: '#635bff', backgroundColor: 'rgba(99,91,255,0.08)', border: '1px solid rgba(99,91,255,0.25)' }}>Read docs</Link>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {downloads.map(([label, href]) => (
            <a key={href} href={href} className="rounded-xl p-4 text-sm font-semibold transition hover:scale-[1.01]" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <span className="block text-lg">⬇️</span>
              {label}
            </a>
          ))}
        </div>

        {/* Step-by-step setup guide */}
        <section className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>How to connect a machine to Myncel</h2>
          <ol className="space-y-4">
            {[
              { step: '1', title: 'Open a machine detail', desc: 'Go to the Equipment tab → click any machine card to open the detail panel.', action: null },
              { step: '2', title: 'Create a Gateway Token', desc: 'Scroll down to "Connected Gateways / Device Tokens" → type a name (e.g. "CNC Lathe edge gateway") → click Create Gateway Token.', action: null },
              { step: '3', title: 'Copy the token', desc: 'The token is shown once. Copy it immediately — you will paste it into your gateway config file.', action: null },
              { step: '4', title: 'Download the gateway package', desc: 'Use the download buttons above to get the Edge Gateway Package, ESP32 sketch, Raspberry Pi agent, or Node-RED flow.', action: null },
              { step: '5', title: 'Generate your YAML config', desc: 'Use the Config Generator below — choose your connector type (Modbus, OPC UA, MQTT, etc.), paste your token, enter the machine IP/port, then click Export YAML.', action: null },
              { step: '6', title: 'Run the gateway', desc: 'Copy the YAML to your laptop/Raspberry Pi. Run: python gateway.py --config myncel_edge_gateway.yaml', action: null },
              { step: '7', title: 'Watch it go live', desc: 'Once running, the Gateway Status table above will show the gateway as Online and start counting readings.', action: null },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex gap-4">
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#635bff' }}>{step}</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Gateway status</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Online/offline state is based on last seen within the past five minutes. Readings count will show as 0 until persisted telemetry counts are added.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th className="px-3 py-2 text-left">Gateway</th>
                  <th className="px-3 py-2 text-left">Machine</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Last seen</th>
                  <th className="px-3 py-2 text-left">Connector type</th>
                  <th className="px-3 py-2 text-left">Readings count</th>
                </tr>
              </thead>
              <tbody>
                {tokens.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center" style={{ color: 'var(--text-secondary)' }}>No gateway tokens yet. Open any machine from the Equipment tab → click a machine → scroll to the Connected Gateways section → click Create Gateway Token.</td></tr>
                ) : tokens.map(token => (
                  <tr key={token.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-3 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{token.name}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{token.machineName}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${token.isActive && isOnline(token.lastSeenAt) ? 'bg-emerald-100 text-emerald-700' : token.isActive ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {token.isActive && isOnline(token.lastSeenAt) ? 'online' : token.isActive ? 'offline' : 'revoked'}
                      </span>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{token.lastSeenAt ? new Date(token.lastSeenAt).toLocaleString() : 'Never'}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{connectorFromName(token.name)}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <GatewayConfigGenerator machineId={firstMachine?.id} machineName={firstMachine?.name} />
      </div>
    </PlanGate>
  );
}
