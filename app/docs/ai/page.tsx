import Link from 'next/link';

export const metadata = {
  title: 'AI & Predictive Maintenance — Documentation',
  description: 'How Myncel\'s anomaly detection engine works, how to configure sensitivity, and how to interpret predictive forecasts.',
};

export default function AIDocsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link href="/docs" className="text-sm text-[var(--accent)] hover:underline">← All documentation</Link>
      <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-3 mb-2">🤖 AI &amp; Predictive Maintenance</h1>
      <p className="text-[var(--text-secondary)] text-base mb-8">
        Myncel ships with a built-in anomaly-detection and predictive-forecasting engine that runs against
        every batch of incoming sensor readings — no external service hookup required, no per-prediction
        billing, no data ever leaves your tenant in the default <strong>Statistical</strong> mode.
      </p>

      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-10 mb-3">How it works</h2>
      <p className="text-[var(--text-secondary)] mb-3">
        The engine maintains a rolling window of the last 30 sensor samples per signal type per machine. It
        computes a baseline using an exponentially weighted moving average (EWMA, λ = 0.3 — recent samples
        weighted more heavily) and a sample standard deviation, then flags any new reading that lands more
        than <code>N</code> standard deviations away.
      </p>
      <p className="text-[var(--text-secondary)] mb-3">
        The σ threshold is controlled by the <strong>Sensitivity</strong> slider (0–100). The mapping is
        linear: <code>0 → 5σ</code> (silent), <code>50 → 3σ</code> (the SPC industry standard, our default),
        <code> 100 → 2σ</code> (paranoid). Any anomaly produces an <code>AnomalyDetection</code> record; if
        its severity meets or exceeds your <strong>Minimum alert severity</strong>, an Alert is also raised
        and routed via your usual notification channels.
      </p>

      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-10 mb-3">The three models</h2>
      <table className="w-full text-sm border border-[var(--border)] rounded-lg overflow-hidden">
        <thead className="bg-[var(--bg-muted)]">
          <tr>
            <th className="text-left px-3 py-2 font-semibold">Model</th>
            <th className="text-left px-3 py-2 font-semibold">When to choose it</th>
            <th className="text-left px-3 py-2 font-semibold">External calls?</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-[var(--border)]">
            <td className="px-3 py-2 font-medium">Statistical</td>
            <td className="px-3 py-2 text-[var(--text-secondary)]">Default. Stable, well-instrumented assets where the baseline is fairly constant.</td>
            <td className="px-3 py-2"><span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">None</span></td>
          </tr>
          <tr className="border-t border-[var(--border)]">
            <td className="px-3 py-2 font-medium">Hybrid</td>
            <td className="px-3 py-2 text-[var(--text-secondary)]">Adds seasonal decomposition. Great for assets with predictable daily / weekly cycles (HVAC, lighting loads, shift-driven CNC spindles).</td>
            <td className="px-3 py-2"><span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">None</span></td>
          </tr>
          <tr className="border-t border-[var(--border)]">
            <td className="px-3 py-2 font-medium">LLM-assisted</td>
            <td className="px-3 py-2 text-[var(--text-secondary)]">Same statistical detection plus AI-written recommendations and root-cause hints. Sends anonymized signal summaries to the in-app chat AI.</td>
            <td className="px-3 py-2"><span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-semibold">Yes (chat AI)</span></td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-10 mb-3">Predictive forecasting</h2>
      <p className="text-[var(--text-secondary)] mb-3">
        For each sensor type with at least 10 samples in the last 30 days, the engine fits a least-squares
        regression line and projects forward. If the trajectory is expected to cross your warning threshold
        (or the statistical anomaly threshold when no custom warn is set) within the configured forecast
        horizon, a <code>PredictiveForecast</code> record is created with a confidence percentage derived
        from the regression&rsquo;s R² value.
      </p>
      <p className="text-[var(--text-secondary)] mb-3">
        Confidence is clamped to the <code>20–95%</code> range — we never report 100% because no real signal
        is perfectly linear, and we never report below 20% because that&rsquo;s indistinguishable from noise.
        Forecasts expire after 24 hours and are regenerated on the next engine run.
      </p>

      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-10 mb-3">Per-machine overrides</h2>
      <p className="text-[var(--text-secondary)] mb-3">
        Every machine has its own AI tab on the equipment detail page. From there you can:
      </p>
      <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1 mb-3">
        <li>Disable AI on a single noisy machine without touching org-wide settings</li>
        <li>Pin a different model than the org default</li>
        <li>Override sensitivity / minimum severity / forecast horizon</li>
        <li>Set custom hard thresholds per sensor type that take priority over statistical detection</li>
        <li>Confirm or reject individual detections — confirmed real anomalies and rejected false positives both feed the SuperAdmin oversight dashboard</li>
      </ul>

      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-10 mb-3">Quiet hours &amp; auto-WO</h2>
      <p className="text-[var(--text-secondary)] mb-3">
        Set quiet hours (UTC) on the org settings page to queue detections during your off-shift and emit
        them when the window closes. Enable <strong>Auto-create work orders</strong> to automatically open a
        draft work order on the affected machine for any HIGH or CRITICAL anomaly — useful once you trust the
        model.
      </p>

      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-10 mb-3">API endpoints</h2>
      <pre className="text-xs bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
{`GET    /api/ai/settings                    # org defaults
PATCH  /api/ai/settings                    # update org defaults (OWNER/ADMIN)

GET    /api/ai/settings/{machineId}        # per-machine + effective
PATCH  /api/ai/settings/{machineId}        # upsert per-machine override

POST   /api/ai/detect                      # run engine across the org
GET    /api/ai/detect/{machineId}          # list detections + forecasts
POST   /api/ai/detect/{machineId}          # run engine on one machine

POST   /api/ai/feedback/{detectionId}      # { feedback: 'CONFIRMED' | 'REJECTED' }`}
      </pre>

      <p className="text-[var(--text-secondary)] mt-6 text-sm">
        SuperAdmin oversight: all detections, forecasts, and feedback rollups are visible per-org from the
        platform admin&rsquo;s <strong>🤖 AI</strong> tab on the Org Control Center.
      </p>
    </main>
  );
}
