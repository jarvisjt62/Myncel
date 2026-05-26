import Link from 'next/link';
import GatewayConfigGenerator from '@/app/components/GatewayConfigGenerator';

export const metadata = {
  title: 'NMEA 2000 Gateway Setup — Myncel Docs',
  description: 'Connect yachts, workboats, charter fleets, and commercial vessels to Myncel via NMEA 2000. Reads engine RPM, oil pressure, coolant, fuel rate, tank levels, GPS, depth, and speed.',
};

export default function ProtocolDocPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/docs/edge-gateway" className="text-sm font-semibold text-[#635bff] hover:underline">← Edge Gateway</Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">NMEA 2000</span>
          </div>
          <Link href="/dashboard/gateway-setup" className="rounded-lg bg-[#635bff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5]">Generate config</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-sm">
          <div className="text-4xl">⛵</div>
          <h1 className="mt-4 text-4xl font-bold text-[var(--text-primary)]">NMEA 2000 (vessels / boats / yachts)</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">NMEA 2000 (IEC 61162-3) is the marine industry&apos;s standard CAN-bus network — every modern engine, chartplotter, GPS, depth sounder, AIS, autopilot, fuel sensor, and tank monitor talks it. Drop a single gateway onto the boat&apos;s NMEA 2000 backbone and Myncel reads engine room, navigation, and tank data without touching the existing wiring.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">When to use it</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">For commercial marine fleets, charter operators, sportfishing boats, working tugs, ferries, and yachts where engine-hour-based PMs and engine-room health monitoring matter. NMEA 2000 covers Volvo Penta, Cummins Marine, Yanmar, Caterpillar Marine, MAN, MTU, Mercury, and most modern marine diesel and gasoline engines.</p>

            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#635bff]">Recommended hardware</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
              <li><strong>Actisense W2K-1</strong> — $400. NMEA 2000 → Wi-Fi/Ethernet gateway, the de facto industry standard.</li>
              <li><strong>Yacht Devices YDEN-02 / YDWG-02</strong> — $250. Compact Ethernet/Wi-Fi gateway with JSON output.</li>
              <li><strong>Maretron USB100</strong> — $250. USB gateway, plays nicely with a Raspberry Pi.</li>
              <li><strong>Raspberry Pi + CAN hat + canboatjs</strong> — $80 total. Maximum flexibility, requires a bit of setup.</li>
            </ul>

            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#635bff]">Standard PGNs read by Myncel</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
              <li><strong>127488</strong> Engine Parameters (Rapid) — RPM</li>
              <li><strong>127489</strong> Engine Parameters (Dynamic) — hours, oil temp/press, coolant temp, fuel rate, alternator voltage, engine load</li>
              <li><strong>127505</strong> Fluid Level — fuel/water/black/grey tanks</li>
              <li><strong>127508</strong> Battery Status — voltage, current, temperature</li>
              <li><strong>128259</strong> Speed (water referenced)</li>
              <li><strong>128267</strong> Water Depth</li>
              <li><strong>129025</strong> Position Rapid Update — latitude/longitude</li>
              <li><strong>129026</strong> COG / SOG Rapid Update</li>
              <li><strong>130306</strong> Wind Data</li>
              <li><strong>130310</strong> Environmental Parameters — sea-water temperature</li>
              <li><strong>127245</strong> Rudder Angle</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[#0a2540] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-white">Example YAML</h2>
            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-relaxed text-[#d6e2ff]">{`connectors:
  - name: charter_boat_alpha_n2k
    type: nmea2000
    udp_host: 127.0.0.1
    udp_port: 2598
    poll_interval_ms: 1000
    signals:
      - engine_rpm
      - engine_hours
      - coolant_temp
      - engine_oil_press
      - fuel_rate
      - fuel_level
      - alternator_volt
      - gps_lat
      - gps_lon
      - speed_over_ground
      - depth
      - water_temp`}</pre>
            <p className="mt-3 text-xs leading-5 text-white/70">The Myncel connector consumes the <a href="https://github.com/canboat/canboat" className="underline" target="_blank" rel="noreferrer">canboat</a> JSON UDP feed (default UDP/2598). Run <code className="rounded bg-white/10 px-1">analyzer -json -udp 2598</code> alongside the gateway, or install <a href="https://signalk.org" className="underline" target="_blank" rel="noreferrer">Signal K</a> on the same Pi for a richer marine data stack.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">USCG / classification-society workflow</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">Pre-departure inspection</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">The shipped <strong>Vessel pre-departure</strong> WO template covers USCG 46 CFR §185.502-style checks: hull / freeboard / bilges, fire-fighting gear expiration, life-saving equipment, navigation lights, sound-signal devices, GMDSS radio check, and engine-room walk-around.</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">Engine-hour PMs</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Engine hours from PGN 127489 feed BY_HOURS schedules. Volvo Penta D6 / D11 schedules, Cummins QSB / QSC / QSL marine schedules, and Yanmar 6LY3 schedules are easy to model directly.</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">Geofence the marina</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Use GPS lat/lon plus a tiny scheduled job hitting the public REST API to detect when a charter boat exits the marina (charter started) and re-enters (return), and auto-create a fuel-and-walkdown WO on return.</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-surface-2)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">Bilge / engine-temp alerts</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Threshold rules on coolant temp &gt; 95°C, oil pressure &lt; 200 kPa at running RPM, or alternator voltage &lt; 12.8 V auto-create HIGH-priority alerts that page the captain via PagerDuty / SMS.</p>
            </div>
          </div>
        </section>

        <GatewayConfigGenerator />
      </main>
    </div>
  );
}
