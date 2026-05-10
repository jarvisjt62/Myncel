import Link from 'next/link';
import GatewayConfigGenerator from '@/app/components/GatewayConfigGenerator';

export const metadata = {
  title: 'Edge Gateway Setup — Myncel Docs',
  description: 'Install the Myncel Edge Gateway for Modbus, OPC UA, MQTT, MTConnect, BACnet, Siemens S7, Rockwell EtherNet/IP, Beckhoff ADS, ESP32, Raspberry Pi, and Node-RED telemetry.',
};

const downloads = [
  ['Edge gateway package', '/api/edge-gateway/download/package', 'Python runtime, plugin connectors, buffering, examples'],
  ['ESP32 sketch', '/api/edge-gateway/download/esp32', 'Standalone Arduino/ESP32 telemetry publisher'],
  ['Raspberry Pi agent', '/api/edge-gateway/download/raspberry-pi', 'Pi-friendly agent wrapper for shop-floor gateways'],
  ['Node-RED flow', '/api/edge-gateway/download/node-red', 'MQTT bridge flow for visual integration'],
  ['Example YAML config', '/api/edge-gateway/download/example-yaml', 'Starter config for the edge gateway runtime'],
];

export default function EdgeGatewayDocsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/docs" className="text-sm font-semibold text-[#635bff] hover:underline">← Docs</Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">Edge Gateway</span>
          </div>
          <Link href="/dashboard/gateway-setup" className="rounded-lg bg-[#635bff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5]">Open Gateway Setup</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-sm">
          <span className="inline-block rounded-full bg-[#635bff]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#635bff]">Edge Gateway</span>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold text-[var(--text-primary)]">Connect shop-floor equipment to Myncel with offline-safe edge telemetry.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">The Myncel Edge Gateway runs near your machines and forwards sensor, PLC, CNC, HMI, and MQTT readings into Myncel. It includes plugin-style connectors, local buffering for network outages, and ready-to-edit examples for Raspberry Pi, ESP32, and Node-RED deployments.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/api/edge-gateway/download/package" className="rounded-lg bg-[#635bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5]">Download package</a>
            <Link href="#downloads" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]">View all downloads</Link>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#635bff]">Protocol docs</p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">Choose a connector to view setup details</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
          <Link href="/docs/edge-gateway/modbus" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#635bff] hover:shadow-md">
            <div className="text-2xl">🔌</div>
            <h2 className="mt-2 text-sm font-bold text-[var(--text-primary)]">Modbus TCP/RTU</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Connect PLCs, VFDs, meters, compressors, chillers, and industrial controllers through Modbus TCP over Ethernet or Modbus RTU over serial.</p>
            <span className="mt-3 inline-block text-xs font-semibold text-[#635bff]">Read documentation →</span>
          </Link>
          <Link href="/docs/edge-gateway/opcua" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#635bff] hover:shadow-md">
            <div className="text-2xl">🏭</div>
            <h2 className="mt-2 text-sm font-bold text-[var(--text-primary)]">OPC UA</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Connect modern PLCs, SCADA servers, HMIs, and industrial data servers using OPC UA node IDs and optional security policies.</p>
            <span className="mt-3 inline-block text-xs font-semibold text-[#635bff]">Read documentation →</span>
          </Link>
          <Link href="/docs/edge-gateway/mqtt" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#635bff] hover:shadow-md">
            <div className="text-2xl">📡</div>
            <h2 className="mt-2 text-sm font-bold text-[var(--text-primary)]">MQTT Subscriber</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Subscribe to telemetry topics from ESP32 devices, Node-RED flows, existing MQTT brokers, and shop-floor sensor gateways.</p>
            <span className="mt-3 inline-block text-xs font-semibold text-[#635bff]">Read documentation →</span>
          </Link>
          <Link href="/docs/edge-gateway/mtconnect" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#635bff] hover:shadow-md">
            <div className="text-2xl">⚙️</div>
            <h2 className="mt-2 text-sm font-bold text-[var(--text-primary)]">MTConnect CNC</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Pull CNC machine status, execution state, spindle load, alarms, and production data from MTConnect agents.</p>
            <span className="mt-3 inline-block text-xs font-semibold text-[#635bff]">Read documentation →</span>
          </Link>
          <Link href="/docs/edge-gateway/bacnet" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#635bff] hover:shadow-md">
            <div className="text-2xl">🏢</div>
            <h2 className="mt-2 text-sm font-bold text-[var(--text-primary)]">BACnet/IP</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Read building automation and facility equipment values from chillers, air compressors, boilers, HVAC, and plant utilities.</p>
            <span className="mt-3 inline-block text-xs font-semibold text-[#635bff]">Read documentation →</span>
          </Link>
          <Link href="/docs/edge-gateway/siemens-s7" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#635bff] hover:shadow-md">
            <div className="text-2xl">🧠</div>
            <h2 className="mt-2 text-sm font-bold text-[var(--text-primary)]">Siemens S7</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Connect Siemens S7 PLCs by reading data blocks, rack/slot addresses, and typed values through the gateway pattern.</p>
            <span className="mt-3 inline-block text-xs font-semibold text-[#635bff]">Read documentation →</span>
          </Link>
          <Link href="/docs/edge-gateway/rockwell-ethernet-ip" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#635bff] hover:shadow-md">
            <div className="text-2xl">🏷️</div>
            <h2 className="mt-2 text-sm font-bold text-[var(--text-primary)]">Rockwell EtherNet/IP</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Read named tags from Allen-Bradley / Rockwell PLCs through EtherNet/IP gateway patterns.</p>
            <span className="mt-3 inline-block text-xs font-semibold text-[#635bff]">Read documentation →</span>
          </Link>
          <Link href="/docs/edge-gateway/beckhoff-ads" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#635bff] hover:shadow-md">
            <div className="text-2xl">📘</div>
            <h2 className="mt-2 text-sm font-bold text-[var(--text-primary)]">Beckhoff ADS</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Read TwinCAT symbols from Beckhoff controllers using AMS Net ID, AMS port, and symbol names.</p>
            <span className="mt-3 inline-block text-xs font-semibold text-[#635bff]">Read documentation →</span>
          </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#635bff]">Install flow</p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">How gateway setup works</h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-[var(--text-secondary)]">
              <p><strong>1. Create a gateway token.</strong> Open a machine detail modal in Admin Machines and click <strong>Create Gateway Token</strong>. Copy the token once and store it on the gateway device.</p>
              <p><strong>2. Generate YAML.</strong> Choose Modbus, OPC UA, MQTT, MTConnect, BACnet, Siemens S7, Rockwell EtherNet/IP, or Beckhoff ADS and export a YAML config.</p>
              <p><strong>3. Run the edge runtime.</strong> Install dependencies on a Raspberry Pi, industrial PC, or VM. The runtime polls connectors, buffers readings locally, and forwards batches to Myncel.</p>
              <p><strong>4. Monitor status.</strong> Last-seen timestamps and token status appear in the machine detail gateway table and the admin Gateway Services page.</p>
            </div>
          </div>

          <div id="downloads" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#635bff]">Downloads</p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">Gateway assets and examples</h2>
            <div className="mt-5 space-y-3">
              {downloads.map(([label, href, desc]) => (
                <a key={href} href={href} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-3 transition hover:border-[#635bff] hover:bg-[#635bff]/5">
                  <span>
                    <span className="block text-sm font-bold text-[var(--text-primary)]">{label}</span>
                    <span className="block text-xs text-[var(--text-secondary)]">{desc}</span>
                  </span>
                  <span className="text-sm font-semibold text-[#635bff]">Download →</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <GatewayConfigGenerator />

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Production checklist</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ['Network', 'Allow outbound HTTPS to Myncel and local access to PLC/CNC devices.'],
              ['Security', 'Store device tokens as environment variables or protected config files.'],
              ['Reliability', 'Enable offline buffering and systemd auto-restart on Raspberry Pi or Linux gateways.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl bg-[var(--bg-surface-2)] p-4">
                <h3 className="font-bold text-[var(--text-primary)]">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
