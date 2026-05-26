import Link from 'next/link';
import GatewayConfigGenerator from '@/app/components/GatewayConfigGenerator';

export const metadata = {
  title: 'OBD-II Gateway Setup — Myncel Docs',
  description: 'Connect cars, light trucks, vans, and motorcycles to Myncel via the universal OBD-II port using a $25 ELM327 dongle. Reads RPM, coolant, fuel level, battery voltage, odometer, and check-engine fault codes.',
};

export default function ProtocolDocPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/docs/edge-gateway" className="text-sm font-semibold text-[#635bff] hover:underline">← Edge Gateway</Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">OBD-II</span>
          </div>
          <Link href="/dashboard/gateway-setup" className="rounded-lg bg-[#635bff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5]">Generate config</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-sm">
          <div className="text-4xl">🚗</div>
          <h1 className="mt-4 text-4xl font-bold text-[var(--text-primary)]">OBD-II (cars / light trucks / vans)</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">Every passenger vehicle sold in the United States since 1996, in the EU since 2001 (petrol) and 2004 (diesel), and most of the rest of the world since the early 2000s, has a 16-pin OBD-II port within reach of the driver&apos;s seat. Plug in an ELM327 adapter and Myncel reads engine data and fault codes through the same standard your local mechanic uses.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">When to use it</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">For service-fleets of cars, vans, light trucks, and motorcycles where you want odometer-based PMs, automatic check-engine code capture, and basic engine telemetry. Pair an ELM327 with a permanently-installed cellular modem (or a phone running our mobile app while parked at the depot) for always-on reporting.</p>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#635bff]">Hardware options</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
              <li><strong>USB ELM327</strong> — $20–30. Plug into a Raspberry Pi or industrial PC mounted in the vehicle.</li>
              <li><strong>Bluetooth ELM327</strong> — $25. Pair with the Myncel mobile app for parked-mode collection.</li>
              <li><strong>Wi-Fi ELM327</strong> — $40. Reaches a depot Wi-Fi network when the vehicle returns.</li>
              <li><strong>Cellular OBD-II tracker</strong> — $80–120. Pushes telemetry over LTE without depending on the vehicle returning to base.</li>
            </ul>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#635bff]">Standard PIDs read by Myncel</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
              <li>Engine RPM, vehicle speed, throttle position, engine load</li>
              <li>Coolant temperature, intake air temperature</li>
              <li>Fuel level, fuel type</li>
              <li>Battery / control-module voltage</li>
              <li>Engine runtime, total distance traveled (odometer)</li>
              <li>Distance with malfunction-indicator-lamp on</li>
              <li>Active and stored DTCs (mode 03 / 07) — &quot;check engine&quot; fault codes</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[#0a2540] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-white">Example YAML</h2>
            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-relaxed text-[#d6e2ff]">{`connectors:
  - name: van_42_obd2
    type: obd2
    serial_port: /dev/ttyUSB0
    baudrate: 38400
    poll_interval_ms: 5000
    read_dtcs: true
    signals:
      - rpm
      - speed
      - coolant_temp
      - engine_load
      - fuel_level
      - battery_voltage
      - runtime
      - odometer`}</pre>
            <p className="mt-3 text-xs leading-5 text-white/70">When a DTC appears, the gateway emits a <code className="rounded bg-white/10 px-1">dtc_present = 1</code> reading. Configure an alert rule on that signal to auto-open a Safety / Diagnostic work order.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Recommended workflow</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">1. Set the machine category</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Create the vehicle in Admin Machines with category <strong>Car / Light Truck / Van</strong>. Add VIN, license plate, and current odometer to the Description / Custom-fields.</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">2. Issue a gateway token</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Open the machine detail and click <strong>Create Gateway Token</strong>. Copy the token onto whatever device runs the OBD-II connector (Raspberry Pi, phone, or cellular adapter).</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">3. Schedule by mileage</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">In PM Schedules, add an oil-change schedule with Frequency = <strong>BY_HOURS</strong> proxying for distance, or use the public REST API to pivot the odometer reading into a custom counter.</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">4. Auto-open WO on DTC</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Add a Threshold rule on the <code>dtc_present</code> signal &gt;= 1 → auto-create a <strong>Diagnostic — DTC detected</strong> work order assigned to your service writer.</p>
            </div>
          </div>
        </section>

        <GatewayConfigGenerator />
      </main>
    </div>
  );
}
