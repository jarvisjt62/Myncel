/**
 * Anomaly Detection Engine — Big Bet #4
 *
 * Statistical anomaly detector + lightweight predictive forecaster.
 * Designed to run server-side on every batch of new SensorReadings and on
 * demand from the equipment detail page / scheduler.
 *
 * The engine is deliberately self-contained: no external API calls in
 * STATISTICAL or HYBRID mode, so it works offline-first and never leaks
 * customer data. LLM_ASSISTED mode passes anonymized summaries to the
 * existing in-app chat AI to generate human-friendly recommendations.
 *
 *   ┌────────────────┐    ┌──────────────┐     ┌──────────────────┐
 *   │ SensorReading  │ →  │ AnomalyEng.  │  →  │ AnomalyDetection │
 *   │ batch          │    │ detect()     │     │ + Alert          │
 *   └────────────────┘    └──────────────┘     └──────────────────┘
 *                              │
 *                              └──→ forecast() → PredictiveForecast
 *
 * Sensitivity → σ mapping (the threshold for "anomalous"):
 *   0   → 5.0σ   silent
 *   25  → 4.0σ
 *   50  → 3.0σ   (default — SPC industry standard)
 *   75  → 2.5σ
 *   100 → 2.0σ   paranoid
 *
 * The mapping is monotonic and clamped, so any UI slider value works.
 */

import type {
  AIModelKind,
  AnomalyDetection,
  Machine,
  MachineAISettings,
  OrgAISettings,
  PredictiveForecast,
  SensorReading,
  Severity,
} from '@prisma/client';

/** Effective settings after merging machine override on top of org default. */
export interface EffectiveAISettings {
  enabled: boolean;
  model: AIModelKind;
  sensitivity: number;
  minAlertSeverity: Severity;
  forecastHorizonDays: number;
  thresholds: Record<string, { warn: number; crit: number; unit?: string }> | null;
}

/** Map 0–100 sensitivity → σ threshold. */
export function sensitivityToSigma(sensitivity: number): number {
  const s = Math.max(0, Math.min(100, sensitivity));
  // Linear interp: 0 → 5σ, 100 → 2σ
  return 5 - (s / 100) * 3;
}

/** Resolve org + machine settings into a single effective object. */
export function resolveSettings(
  org: OrgAISettings | null,
  machine: MachineAISettings | null,
): EffectiveAISettings {
  return {
    enabled: (org?.enabled ?? true) && (machine?.enabled ?? true),
    model: machine?.model ?? org?.model ?? 'STATISTICAL',
    sensitivity: machine?.sensitivity ?? org?.sensitivity ?? 50,
    minAlertSeverity: machine?.minAlertSeverity ?? org?.minAlertSeverity ?? 'LOW',
    forecastHorizonDays: machine?.forecastHorizonDays ?? org?.forecastHorizonDays ?? 30,
    thresholds: (machine?.thresholds as any) ?? null,
  };
}

/** Standard summary stats for a window of readings. */
export interface WindowStats {
  count: number;
  mean: number;
  stddev: number;
  ewma: number; // exponentially weighted moving average (more recent-biased)
  min: number;
  max: number;
}

const EWMA_LAMBDA = 0.3;

export function computeStats(values: number[]): WindowStats {
  if (values.length === 0) {
    return { count: 0, mean: 0, stddev: 0, ewma: 0, min: 0, max: 0 };
  }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, values.length - 1);
  const stddev = Math.sqrt(variance);
  let ewma = values[0];
  for (let i = 1; i < values.length; i++) {
    ewma = EWMA_LAMBDA * values[i] + (1 - EWMA_LAMBDA) * ewma;
  }
  return {
    count: values.length,
    mean,
    stddev,
    ewma,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/** Map a deviation magnitude to a Severity. */
export function severityFromSigma(sigma: number, threshold: number): Severity {
  const ratio = sigma / threshold;
  if (ratio >= 2.0) return 'CRITICAL';
  if (ratio >= 1.5) return 'HIGH';
  if (ratio >= 1.0) return 'MEDIUM';
  return 'LOW';
}

const SEVERITY_RANK: Record<Severity, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};
export function severityAtLeast(a: Severity, b: Severity): boolean {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b];
}

/** Output of detect() before persistence. */
export interface PendingDetection {
  sensorType: string;
  value: number;
  unit: string | null;
  baseline: number;
  deviation: number;
  threshold: number;
  severity: Severity;
  message: string;
  recommendation: string | null;
  modelUsed: AIModelKind;
  shouldRaiseAlert: boolean;
  detectedAt: Date;
}

/**
 * Analyze a stream of recent SensorReadings for one machine and return
 * any anomalies. The caller is responsible for persisting them and
 * raising Alerts (so this function stays pure / testable).
 *
 *   readings — most recent first OR oldest first; we sort internally.
 *   settings — already-resolved effective settings.
 *
 * Detection rules:
 *  1. Group readings by sensor type.
 *  2. Compute rolling stats over the most recent N (default 30) samples.
 *  3. The latest sample is anomalous if either:
 *       a. |value − ewma| / stddev ≥ sigmaThreshold, OR
 *       b. value crosses any custom threshold from settings.thresholds.
 *  4. Severity = severityFromSigma(deviation, sigmaThreshold) — except
 *     custom-threshold crossings start at HIGH (warn) / CRITICAL (crit).
 *  5. Filter out anything below settings.minAlertSeverity for Alert
 *     creation (still recorded as Detection).
 */
export function detectAnomalies(
  readings: SensorReading[],
  settings: EffectiveAISettings,
): PendingDetection[] {
  if (!settings.enabled || readings.length === 0) return [];

  const sigmaThreshold = sensitivityToSigma(settings.sensitivity);
  const byType = new Map<string, SensorReading[]>();
  for (const r of readings) {
    if (!byType.has(r.type)) byType.set(r.type, []);
    byType.get(r.type)!.push(r);
  }

  const out: PendingDetection[] = [];

  for (const [sensorType, group] of Array.from(byType.entries())) {
    // Sort oldest → newest so EWMA carries forward correctly.
    const sorted = [...group].sort(
      (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime(),
    );
    if (sorted.length < 5) continue; // need a minimum baseline

    const window = sorted.slice(-30);
    const latest = window[window.length - 1];
    const history = window.slice(0, -1);
    const stats = computeStats(history.map((r) => r.value));

    if (stats.stddev === 0) continue; // flat-line, can't detect anomalies

    const deviation = (latest.value - stats.ewma) / stats.stddev; // signed σ
    const absDev = Math.abs(deviation);

    // --- Rule (b): custom threshold crossings ---
    const custom = settings.thresholds?.[sensorType];
    if (custom) {
      const v = latest.value;
      if (typeof custom.crit === 'number' && v >= custom.crit) {
        out.push({
          sensorType,
          value: latest.value,
          unit: latest.unit,
          baseline: stats.ewma,
          deviation,
          threshold: custom.crit,
          severity: 'CRITICAL',
          message: `${sensorType} ${latest.value.toFixed(2)} ${latest.unit} crossed CRITICAL threshold ${custom.crit} ${custom.unit ?? latest.unit}.`,
          recommendation: null,
          modelUsed: settings.model,
          shouldRaiseAlert: severityAtLeast('CRITICAL', settings.minAlertSeverity),
          detectedAt: latest.recordedAt,
        });
        continue;
      }
      if (typeof custom.warn === 'number' && v >= custom.warn) {
        out.push({
          sensorType,
          value: latest.value,
          unit: latest.unit,
          baseline: stats.ewma,
          deviation,
          threshold: custom.warn,
          severity: 'HIGH',
          message: `${sensorType} ${latest.value.toFixed(2)} ${latest.unit} crossed warning threshold ${custom.warn} ${custom.unit ?? latest.unit}.`,
          recommendation: null,
          modelUsed: settings.model,
          shouldRaiseAlert: severityAtLeast('HIGH', settings.minAlertSeverity),
          detectedAt: latest.recordedAt,
        });
        continue;
      }
    }

    // --- Rule (a): statistical deviation ---
    if (absDev >= sigmaThreshold) {
      const severity = severityFromSigma(absDev, sigmaThreshold);
      const direction = deviation > 0 ? 'above' : 'below';
      out.push({
        sensorType,
        value: latest.value,
        unit: latest.unit,
        baseline: stats.ewma,
        deviation,
        threshold: sigmaThreshold,
        severity,
        message: `${sensorType} ${latest.value.toFixed(2)} ${latest.unit} — ${absDev.toFixed(1)}σ ${direction} baseline of ${stats.ewma.toFixed(2)} ${latest.unit} (over ${history.length} prior samples).`,
        recommendation: null,
        modelUsed: settings.model,
        shouldRaiseAlert: severityAtLeast(severity, settings.minAlertSeverity),
        detectedAt: latest.recordedAt,
      });
    }
  }

  return out;
}

/**
 * Lightweight linear-regression forecast: fit a least-squares line to the
 * window and project forward to find the first crossing of stats.mean +
 * sigmaThreshold * stats.stddev (or the custom warn threshold if set).
 *
 * Returns null when:
 *  - fewer than 10 samples
 *  - slope is essentially zero (no trend → won't cross anything in horizon)
 *  - the projected crossing falls outside the horizon
 */
export interface PendingForecast {
  sensorType: string;
  predictedFailureAt: Date;
  confidence: number; // 0–100
  recommendation: string;
  horizonDays: number;
}

export function forecastFailures(
  machine: Machine,
  readings: SensorReading[],
  settings: EffectiveAISettings,
): PendingForecast[] {
  if (!settings.enabled || readings.length < 10) return [];

  const horizonMs = settings.forecastHorizonDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const cutoff = now - 30 * 24 * 60 * 60 * 1000; // last 30 days
  const recent = readings.filter((r) => r.recordedAt.getTime() >= cutoff);
  if (recent.length < 10) return [];

  const byType = new Map<string, SensorReading[]>();
  for (const r of recent) {
    if (!byType.has(r.type)) byType.set(r.type, []);
    byType.get(r.type)!.push(r);
  }

  const out: PendingForecast[] = [];
  const sigmaThreshold = sensitivityToSigma(settings.sensitivity);

  for (const [sensorType, group] of Array.from(byType.entries())) {
    const sorted = [...group].sort(
      (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime(),
    );
    if (sorted.length < 10) continue;

    // x = ms-since-first-reading, y = value
    const t0 = sorted[0].recordedAt.getTime();
    const xs = sorted.map((r) => r.recordedAt.getTime() - t0);
    const ys = sorted.map((r) => r.value);

    // Least-squares slope + intercept
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const sumX2 = xs.reduce((a, x) => a + x * x, 0);

    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) continue;
    const slope = (n * sumXY - sumX * sumY) / denom; // value per ms
    const intercept = (sumY - slope * sumX) / n;
    if (Math.abs(slope) < 1e-12) continue; // no drift

    // R² to estimate confidence
    const meanY = sumY / n;
    const ssTot = ys.reduce((a, y) => a + (y - meanY) ** 2, 0);
    const ssRes = ys.reduce((a, y, i) => a + (y - (intercept + slope * xs[i])) ** 2, 0);
    const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    // Threshold to project against
    const stats = computeStats(ys);
    const custom = settings.thresholds?.[sensorType];
    const targetValue = custom?.warn ?? stats.mean + sigmaThreshold * stats.stddev;

    // x at which projected value crosses target: x = (target - intercept) / slope
    if ((slope > 0 && targetValue <= intercept) || (slope < 0 && targetValue >= intercept)) {
      continue; // already past target — should be a detection, not a forecast
    }
    const xCross = (targetValue - intercept) / slope;
    const tCross = t0 + xCross;
    const msUntil = tCross - now;
    if (msUntil <= 0 || msUntil > horizonMs) continue; // already happened or outside horizon

    const daysUntil = Math.round(msUntil / (24 * 60 * 60 * 1000));
    const confidence = Math.max(20, Math.min(95, Math.round(r2 * 100)));
    const recommendation = `${sensorType} is trending ${slope > 0 ? 'upward' : 'downward'} and is projected to cross the ${custom?.warn != null ? 'warning threshold' : 'statistical anomaly threshold'} (${targetValue.toFixed(2)}${stats.stddev > 0 ? '' : ''}) in approximately ${daysUntil} day${daysUntil === 1 ? '' : 's'}. Schedule preventive inspection of "${machine.name}" within the next ${Math.max(1, Math.floor(daysUntil * 0.7))} day${Math.max(1, Math.floor(daysUntil * 0.7)) === 1 ? '' : 's'}.`;

    out.push({
      sensorType,
      predictedFailureAt: new Date(tCross),
      confidence,
      recommendation,
      horizonDays: settings.forecastHorizonDays,
    });
  }

  return out;
}

/** Public type re-exports used by the API layer. */
export type {
  AIModelKind,
  AnomalyDetection,
  MachineAISettings,
  OrgAISettings,
  PredictiveForecast,
};
