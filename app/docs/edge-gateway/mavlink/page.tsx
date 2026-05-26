import Link from 'next/link';
import GatewayConfigGenerator from '@/app/components/GatewayConfigGenerator';

export const metadata = {
  title: 'MAVLink Gateway Setup — Myncel Docs',
  description: 'Connect ArduPilot and PX4 drones / UAVs to Myncel via MAVLink. Reads battery voltage, current, remaining percent, ground speed, altitude, GPS fix, satellite count, and autopilot status.',
};

export default function ProtocolDocPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/docs/edge-gateway" className="text-sm font-semibold text-[#635bff] hover:underline">← Edge Gateway</Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">MAVLink</span>
          </div>
          <Link href="/dashboard/gateway-setup" className="rounded-lg bg-[#635bff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5]">Generate config</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-sm">
          <div className="text-4xl">🛸</div>
          <h1 className="mt-4 text-4xl font-bold text-[var(--text-primary)]">MAVLink (drones / UAVs)</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">MAVLink is the open telemetry protocol every PX4 and ArduPilot autopilot speaks — Pixhawk, Cube, Holybro, Matek, and the long tail of carrier boards inherit it for free. Myncel pulls battery, GPS, ground-speed, altitude, and autopilot health into the same maintenance system you use for the rest of your fleet.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">When to use it</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">For commercial UAV operators — surveyors, agricultural-spray operators, public-safety drones, infrastructure inspection, search-and-rescue. The connector is intentionally read-only telemetry; Myncel never sends commands to the autopilot.</p>

            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              <strong>Out of scope:</strong> manned aircraft / ARINC 429. Manned-aviation maintenance is FAA Part 43 / 145 / EASA Part-145 regulated software territory and is intentionally not a Myncel feature.
            </div>

            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#635bff]">Connection options</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
              <li><strong>915 / 433 MHz radio modem</strong> (RFD900x, SiK telemetry) — point a ground-side modem at a Pi running the Myncel agent.</li>
              <li><strong>USB direct</strong> — for hangar / pre-flight diagnostics on a Pi or laptop tethered to the autopilot.</li>
              <li><strong>Wi-Fi telemetry bridge</strong> (ESP8266 / ESP32) — drone parks back at base, connects to depot Wi-Fi, dumps the flight log.</li>
              <li><strong>Cellular / LTE companion</strong> — a Raspberry Pi 4 + LTE hat onboard streams MAVLink over UDP to your ground station and to Myncel simultaneously.</li>
            </ul>

            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#635bff]">MAVLink messages read by Myncel</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
              <li><strong>BATTERY_STATUS</strong> — pack voltage, current, remaining percent</li>
              <li><strong>VFR_HUD</strong> — airspeed, ground speed, altitude, climb rate, throttle</li>
              <li><strong>GPS_RAW_INT</strong> — fix type, satellites visible</li>
              <li><strong>GLOBAL_POSITION_INT</strong> — lat / lon / relative altitude</li>
              <li><strong>SYS_STATUS</strong> — overall system voltage and CPU load</li>
              <li><strong>STATUSTEXT</strong> (severity ≤ 3, ERROR or worse) — surfaced as <code>autopilot_alert = 1</code></li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[#0a2540] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-white">Example YAML</h2>
            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-relaxed text-[#d6e2ff]">{`connectors:
  - name: ardupilot_quad_07
    type: mavlink
    connection: udpin:0.0.0.0:14550
    poll_interval_ms: 5000
    signals:
      - battery_voltage
      - battery_remaining
      - ground_speed
      - altitude_msl
      - gps_fix_type
      - satellites_visible
      - system_load`}</pre>
            <p className="mt-3 text-xs leading-5 text-white/70">Common connection strings: <code className="rounded bg-white/10 px-1">udpin:0.0.0.0:14550</code> (Mission Planner / QGC default port), <code className="rounded bg-white/10 px-1">serial:/dev/ttyUSB0:57600</code> (USB or radio modem), <code className="rounded bg-white/10 px-1">tcp:192.168.4.1:5760</code> (ESP-based Wi-Fi telemetry).</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">UAV maintenance workflow</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">Battery cycle tracking</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Track every battery as its own Machine (category = Drone / UAV) and configure a BY_HOURS schedule that proxies for cycle count. LiPo packs typically retire at 200–300 cycles; Myncel reminds you to swap them out before mid-flight failure.</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">Pre-flight checklist</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">The shipped <strong>UAV pre-flight checklist</strong> WO template covers airframe, propellers, motor temps, battery voltage at rest, GPS HDOP, RC link, telemetry link, geofence load, and RTH altitude. Generated automatically on the day of every flight.</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">Autopilot fault → WO</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">When STATUSTEXT severity ≤ 3 fires, the connector emits <code>autopilot_alert = 1</code>. Auto-create a Diagnostic WO so the issue is investigated before the next flight.</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">Flight-hours-based PMs</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Total flight hours feed BY_HOURS schedules for prop replacement, ESC inspection, and motor bearing checks. Hours come from the autopilot&apos;s own runtime counter.</p>
            </div>
          </div>
        </section>

        <GatewayConfigGenerator />
      </main>
    </div>
  );
}
