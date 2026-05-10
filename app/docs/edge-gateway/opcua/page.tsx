import Link from 'next/link';
import GatewayConfigGenerator from '@/app/components/GatewayConfigGenerator';

export const metadata = {
  title: 'OPC UA Gateway Setup — Myncel Docs',
  description: 'Connect modern PLCs, SCADA servers, HMIs, and industrial data servers using OPC UA node IDs and optional security policies.',
};

export default function ProtocolDocPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/docs/edge-gateway" className="text-sm font-semibold text-[#635bff] hover:underline">← Edge Gateway</Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">OPC UA</span>
          </div>
          <Link href="/dashboard/gateway-setup" className="rounded-lg bg-[#635bff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5]">Generate config</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-sm">
          <div className="text-4xl">🏭</div>
          <h1 className="mt-4 text-4xl font-bold text-[var(--text-primary)]">OPC UA</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">Connect modern PLCs, SCADA servers, HMIs, and industrial data servers using OPC UA node IDs and optional security policies.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">When to use it</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Use OPC UA when the controller exposes named nodes, browseable address spaces, or secure machine telemetry over opc.tcp.</p>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#635bff]">Setup tips</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
              <li>Browse the server once to confirm namespace indexes and node IDs.</li>
              <li>Use certificates and a security policy in production where supported.</li>
              <li>Keep polling intervals reasonable for PLC CPU load.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[#0a2540] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-white">Example YAML</h2>
            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-relaxed text-[#d6e2ff]">connectors:
  - name: line_runtime
    type: opcua
    endpoint: opc.tcp://192.168.1.60:4840
    node_id: ns=2;s=Machine.RuntimeHours
    security_policy: None
    poll_interval_ms: 1000</pre>
          </div>
        </section>

        <GatewayConfigGenerator />
      </main>
    </div>
  );
}
