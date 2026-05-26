import Link from 'next/link';
import GatewayConfigGenerator from '@/app/components/GatewayConfigGenerator';

export const metadata = {
  title: 'SAE J1939 Gateway Setup — Myncel Docs',
  description: 'Connect Class 7-8 trucks, buses, and off-highway equipment to Myncel via SAE J1939 over CAN bus. Reads engine RPM, fuel rate, DEF level, transmission temp, odometer, hours, and active DTCs.',
};

export default function ProtocolDocPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/docs/edge-gateway" className="text-sm font-semibold text-[#635bff] hover:underline">← Edge Gateway</Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">SAE J1939</span>
          </div>
          <Link href="/dashboard/gateway-setup" className="rounded-lg bg-[#635bff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5]">Generate config</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-sm">
          <div className="text-4xl">🚛</div>
          <h1 className="mt-4 text-4xl font-bold text-[var(--text-primary)]">SAE J1939 (heavy trucks / buses / off-highway)</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">J1939 is the heavy-duty CAN-bus protocol used by Freightliner, Kenworth, Peterbilt, Volvo, Mack, International, Caterpillar, John Deere, Komatsu, Cummins, Detroit Diesel, and basically every Class 7–8 truck or off-highway machine built since the late 1990s. Plug a CAN-bus interface into the green 9-pin Deutsch diagnostic connector under the dash and Myncel reads engine, fuel, DEF, transmission, and odometer telemetry.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">When to use it</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Use J1939 for any diesel truck, bus, ag tractor, dozer, excavator, telehandler, or generator that exposes the green 9-pin Deutsch diagnostic connector. The same protocol covers ~95% of commercial heavy-duty equipment globally.</p>

            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#635bff]">Hardware options</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
              <li><strong>Raspberry Pi + MCP2515 CAN hat</strong> — $80 total. Lowest cost, runs the Myncel edge agent directly.</li>
              <li><strong>PCAN-USB / PCAN-USB Pro</strong> (Peak System) — $250–500. Industrial-grade, certified for diagnostics.</li>
              <li><strong>Kvaser Leaf Light v2</strong> — $300. Common in OEM service tooling.</li>
              <li><strong>Innomaker USB-CAN</strong> — $40. Cheap and adequate for non-critical fleets.</li>
              <li><strong>Cellular J1939 telematics box</strong> — $400–800. Always-on, no on-board host required.</li>
            </ul>

            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#635bff]">Standard PGN/SPN read by Myncel</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
              <li>Engine RPM, percent load, idle time</li>
              <li>Coolant temperature, oil temperature, oil pressure</li>
              <li>Fuel rate, fuel level, total fuel used</li>
              <li>DEF (Diesel Exhaust Fluid) level — critical for Tier 4 diesels</li>
              <li>Transmission temperature, retarder temperature</li>
              <li>Total engine hours, total vehicle distance (odometer)</li>
              <li>Vehicle speed, ambient air temperature</li>
              <li>Battery voltage, alternator voltage</li>
              <li>DM1 active diagnostic trouble codes (DTCs) with FMI / occurrence count</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[#0a2540] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-white">Example YAML</h2>
            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-relaxed text-[#d6e2ff]">{`connectors:
  - name: kenworth_t680_18_j1939
    type: j1939
    can_interface: can0
    bitrate: 250000
    poll_interval_ms: 1000
    read_dtcs: true
    signals:
      - engine_rpm
      - vehicle_speed
      - engine_load
      - coolant_temp
      - oil_pressure
      - fuel_rate
      - fuel_level
      - def_level
      - transmission_temp
      - total_engine_hours
      - total_distance
      - battery_voltage`}</pre>
            <p className="mt-3 text-xs leading-5 text-white/70">On a Raspberry Pi, bring the CAN interface up with <code className="rounded bg-white/10 px-1">sudo ip link set can0 up type can bitrate 250000</code> before starting the gateway.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">FMCSA / DOT-aware workflow</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">DVIR pre-trip / post-trip</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">The shipped <strong>DVIR — Pre-trip inspection</strong> work-order template covers the FMCSA 49 CFR §396.11 line items (brakes, parking brake, steering, lights, reflectors, tires, wheels, mirrors, coupling, horn, emergency equipment). See the <Link href="/handbook" className="text-[#635bff] hover:underline">Vehicle, vessel, and UAV maintenance</Link> chapter.</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">DTC → repair WO</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">When DM1 reports any active fault, the connector emits <code>dtc_present = 1</code>. Add an alert rule to auto-open a <strong>Diagnostic — DTC detected</strong> work order with Priority = HIGH for any code in the engine, after-treatment, or brake-system SPN ranges.</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">Hours-based PMs</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Engine hours from PGN 0xFEE5 feed the standard PM <strong>BY_HOURS</strong> frequency. Set 250 / 500 / 1000-hour services per OEM and let Myncel auto-generate the next WO when the threshold is crossed.</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">DEF level monitoring</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Tier 4 diesels go into limp-home mode when DEF gets low. Add a Threshold alert at 15% to remind drivers to refill before the truck derates.</p>
            </div>
          </div>
        </section>

        <GatewayConfigGenerator />
      </main>
    </div>
  );
}
