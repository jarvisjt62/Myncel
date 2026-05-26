import Link from 'next/link';

export const metadata = {
  title: 'Telematics Importers — Myncel Docs',
  description: 'Import vehicle telematics readings from Geotab, Samsara, Verizon Connect, Motive (KeepTruckin), and Fleetio into Myncel via the /api/telematics/import endpoint.',
};

const PROVIDERS = [
  { id: 'geotab', label: 'Geotab MyAdmin / Add-Ins', description: 'Diagnostic-keyed events. Push from a Geotab Add-In or scheduled MyAdmin SDK pull.', sample: `{
  "dateTime": "2025-01-12T14:23:00Z",
  "diagnostic": { "id": "DiagnosticOdometerAdjustmentId", "name": "odometer" },
  "value": 184239.5,
  "unit": "km"
}` },
  { id: 'samsara', label: 'Samsara webhook (vehicle stats)', description: 'Snapshot-shaped payload — Myncel flattens the known fields into separate readings.', sample: `{
  "vehicleId": "281474976710999",
  "time": "2025-01-12T14:23:00Z",
  "gpsOdometerMeters": 184239500,
  "fuelPercents": 64,
  "engineRpm": 1450,
  "engineCoolantTemperatureMilliC": 89000,
  "ecuSpeedKilometersPerHour": 92.4,
  "defLevelPercent": 47
}` },
  { id: 'verizon', label: 'Verizon Connect / Reveal', description: 'Per-signal records. Send one POST per signal or batch as an array.', sample: `[
  { "deviceId": "VZ123", "time": "2025-01-12T14:23:00Z", "signal": { "name": "engine_hours", "value": 4527.2, "unit": "h" } },
  { "deviceId": "VZ123", "time": "2025-01-12T14:23:00Z", "signal": { "name": "fuel_level", "value": 64, "unit": "%" } }
]` },
  { id: 'motive', label: 'Motive (KeepTruckin)', description: 'Vehicle current_state shape from Motive Fleet API.', sample: `{
  "vehicle": { "number": "Tractor 18" },
  "current_state": {
    "recorded_at": "2025-01-12T14:23:00Z",
    "gps_odometer_km": 184239,
    "fuel_percent": 64,
    "speed_kph": 92,
    "engine_hours": 4527.2,
    "def_percent": 47
  }
}` },
  { id: 'fleetio', label: 'Fleetio meter readings', description: 'Push every meter entry as it is created in Fleetio.', sample: `{
  "meter_entry": {
    "meter_type": "odometer",
    "value": 184239,
    "units": "km",
    "recorded_at": "2025-01-12T14:23:00Z"
  }
}` },
  { id: 'generic', label: 'Generic / custom integration', description: 'Same shape as /api/iot/ingest. Use this if your telematics provider is not in the list yet.', sample: `[
  { "type": "engine_rpm",       "value": 1450,    "unit": "rpm",  "recordedAt": "2025-01-12T14:23:00Z" },
  { "type": "vehicle_speed",    "value": 92.4,    "unit": "km/h", "recordedAt": "2025-01-12T14:23:00Z" },
  { "type": "fuel_level",       "value": 64,      "unit": "%",    "recordedAt": "2025-01-12T14:23:00Z" },
  { "type": "odometer",         "value": 184239,  "unit": "km",   "recordedAt": "2025-01-12T14:23:00Z" }
]` },
];

export default function TelematicsDocsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/docs" className="text-sm font-semibold text-[#635bff] hover:underline">← Docs</Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">Telematics importers</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-sm">
          <span className="inline-block rounded-full bg-[#635bff]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#635bff]">Telematics</span>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold text-[var(--text-primary)]">Import telematics readings from Geotab, Samsara, Verizon Connect, Motive, and Fleetio.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">If you already pay for a fleet-telematics product, you do not need to install the Myncel Edge Gateway in the vehicle. Forward the data you already have to <code className="rounded bg-[var(--bg-surface-2)] px-1">POST /api/telematics/import</code> and Myncel becomes the CMMS layer on top of telematics you already trust — odometer-based PMs, fuel level alerts, fault-code WOs, all without a second device under the dash.</p>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">How it works</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
            <li><strong>1. Create the vehicle in Myncel.</strong> In Admin Machines, add the vehicle with the appropriate category — Car / Light Truck, Heavy Truck / Bus, Vessel, or Drone / UAV. Add VIN, license plate, and current odometer if you have them.</li>
            <li><strong>2. Generate a Gateway Token.</strong> Open the machine detail and click <strong>Create Gateway Token</strong>. Copy the token once.</li>
            <li><strong>3. Send readings.</strong> POST a JSON payload to <code className="rounded bg-[var(--bg-surface-2)] px-1">/api/telematics/import?provider=&lt;provider&gt;</code>. Authenticate with <code className="rounded bg-[var(--bg-surface-2)] px-1">Authorization: Bearer &lt;token&gt;</code> or <code className="rounded bg-[var(--bg-surface-2)] px-1">X-Myncel-Device-Token: &lt;token&gt;</code>.</li>
            <li><strong>4. Configure schedules and alerts.</strong> Use the imported odometer / engine-hours readings to drive BY_HOURS PM schedules; threshold alerts on coolant temp, oil pressure, DEF level, and battery voltage to auto-open work orders.</li>
          </ol>
          <div className="mt-4 rounded-xl border border-[#635bff]/30 bg-[#635bff]/5 p-3 text-xs leading-5 text-[var(--text-secondary)]">
            <strong>Tip:</strong> If you do not pass <code>?provider=...</code>, Myncel auto-detects the provider from payload shape (Geotab&apos;s <code>diagnostic</code> field, Samsara&apos;s <code>gpsOdometerMeters</code>, Verizon&apos;s <code>signal</code>, Motive&apos;s <code>current_state</code>, Fleetio&apos;s <code>meter_entry</code>).
          </div>
        </section>

        {PROVIDERS.map(p => (
          <section key={p.id} className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[#635bff]">Provider</p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{p.label}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{p.description}</p>
              <p className="mt-4 text-xs font-semibold text-[var(--text-secondary)]">Endpoint</p>
              <pre className="mt-1 rounded-lg bg-[var(--bg-surface-2)] p-3 text-xs leading-5">POST /api/telematics/import?provider={p.id}{'\n'}Authorization: Bearer &lt;gateway_token&gt;{'\n'}Content-Type: application/json</pre>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[#0a2540] p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">Sample payload</p>
              <pre className="mt-2 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-relaxed text-[#d6e2ff]">{p.sample}</pre>
            </div>
          </section>
        ))}

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Field mapping reference</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Whichever provider you push, Myncel normalizes everything into the same internal reading shape (<code>type</code>, <code>value</code>, <code>unit</code>, <code>recordedAt</code>) so your alert rules and PM schedules work identically across the fleet.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                <tr><th className="py-2 pr-4">Myncel reading type</th><th className="py-2 pr-4">Geotab</th><th className="py-2 pr-4">Samsara</th><th className="py-2 pr-4">Motive</th><th className="py-2">Verizon / Generic</th></tr>
              </thead>
              <tbody className="text-[var(--text-secondary)]">
                <tr className="border-b border-[var(--border)]"><td className="py-2 pr-4 font-semibold">odometer</td><td>diagnostic.name = odometer</td><td>gpsOdometerMeters</td><td>current_state.gps_odometer_km</td><td>name = odometer</td></tr>
                <tr className="border-b border-[var(--border)]"><td className="py-2 pr-4 font-semibold">engine_rpm</td><td>diagnostic.name = engine_rpm</td><td>engineRpm</td><td>n/a</td><td>name = engine_rpm</td></tr>
                <tr className="border-b border-[var(--border)]"><td className="py-2 pr-4 font-semibold">vehicle_speed</td><td>n/a</td><td>ecuSpeedKilometersPerHour</td><td>current_state.speed_kph</td><td>name = vehicle_speed</td></tr>
                <tr className="border-b border-[var(--border)]"><td className="py-2 pr-4 font-semibold">fuel_level</td><td>diagnostic.name = fuel_level</td><td>fuelPercents</td><td>current_state.fuel_percent</td><td>name = fuel_level</td></tr>
                <tr className="border-b border-[var(--border)]"><td className="py-2 pr-4 font-semibold">coolant_temp</td><td>diagnostic.name = coolant_temp</td><td>engineCoolantTemperatureMilliC</td><td>n/a</td><td>name = coolant_temp</td></tr>
                <tr className="border-b border-[var(--border)]"><td className="py-2 pr-4 font-semibold">def_level</td><td>diagnostic.name = def_level</td><td>defLevelPercent</td><td>current_state.def_percent</td><td>name = def_level</td></tr>
                <tr><td className="py-2 pr-4 font-semibold">engine_hours</td><td>diagnostic.name = engine_hours</td><td>obdEngineSecondsTotal (s)</td><td>current_state.engine_hours</td><td>name = engine_hours</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
