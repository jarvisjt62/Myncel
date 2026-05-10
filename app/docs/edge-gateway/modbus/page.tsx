import Link from 'next/link';
import GatewayConfigGenerator from '@/app/components/GatewayConfigGenerator';

export const metadata = {
  title: 'Modbus TCP/RTU Gateway Setup — Myncel Docs',
  description: 'Connect PLCs, VFDs, meters, compressors, chillers, and industrial controllers through Modbus TCP over Ethernet or Modbus RTU over serial.',
};

export default function ProtocolDocPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/docs/edge-gateway" className="text-sm font-semibold text-[#635bff] hover:underline">← Edge Gateway</Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">Modbus TCP/RTU</span>
          </div>
          <Link href="/dashboard/gateway-setup" className="rounded-lg bg-[#635bff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5]">Generate config</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-sm">
          <div className="text-4xl">🔌</div>
          <h1 className="mt-4 text-4xl font-bold text-[var(--text-primary)]">Modbus TCP/RTU</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">Connect PLCs, VFDs, meters, compressors, chillers, and industrial controllers through Modbus TCP over Ethernet or Modbus RTU over serial.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">When to use it</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Use Modbus when the equipment exposes register maps, coil states, holding registers, input registers, or serial RS-485 telemetry.</p>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#635bff]">Setup tips</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
              <li>Confirm the register base: some vendors document 40001 while libraries expect zero-based 0.</li>
              <li>For RTU, verify baudrate, parity, stopbits, unit ID, and USB serial adapter permissions.</li>
              <li>Poll only the registers you need and batch adjacent registers where possible.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[#0a2540] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-white">Example YAML</h2>
            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-relaxed text-[#d6e2ff]">connectors:
  - name: spindle_load
    type: modbus_tcp
    host: 192.168.1.50
    port: 502
    unit_id: 1
    register: 40001
    data_type: float32
    poll_interval_ms: 1000

  - name: compressor_pressure
    type: modbus_rtu
    serial_port: /dev/ttyUSB0
    baudrate: 9600
    parity: N
    stopbits: 1
    unit_id: 1
    register: 30001
    data_type: int16
    poll_interval_ms: 2000</pre>
          </div>
        </section>

        <GatewayConfigGenerator />
      </main>
    </div>
  );
}
