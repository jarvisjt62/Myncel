import Link from 'next/link';
import GatewayConfigGenerator from '@/app/components/GatewayConfigGenerator';

export const metadata = {
  title: 'BACnet/IP Gateway Setup — Myncel Docs',
  description: 'Read building automation and facility equipment values from chillers, air compressors, boilers, HVAC, and plant utilities.',
};

export default function ProtocolDocPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/docs/edge-gateway" className="text-sm font-semibold text-[#635bff] hover:underline">← Edge Gateway</Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">BACnet/IP</span>
          </div>
          <Link href="/dashboard/gateway-setup" className="rounded-lg bg-[#635bff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5]">Generate config</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-sm">
          <div className="text-4xl">🏢</div>
          <h1 className="mt-4 text-4xl font-bold text-[var(--text-primary)]">BACnet/IP</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">Read building automation and facility equipment values from chillers, air compressors, boilers, HVAC, and plant utilities.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">When to use it</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Use BACnet/IP for facility systems that expose analogInput, binaryInput, or object properties.</p>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#635bff]">Setup tips</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
              <li>Coordinate with facilities teams to identify device IDs and object instances.</li>
              <li>BACnet networks may require BBMD/routing configuration across subnets.</li>
              <li>Use conservative polling intervals for shared building networks.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[#0a2540] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-white">Example YAML</h2>
            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-relaxed text-[#d6e2ff]">connectors:
  - name: chiller_supply_temp
    type: bacnet
    device_address: 192.168.1.70
    object_type: analogInput
    object_instance: 1
    property: presentValue
    poll_interval_ms: 5000</pre>
          </div>
        </section>

        <GatewayConfigGenerator />
      </main>
    </div>
  );
}
