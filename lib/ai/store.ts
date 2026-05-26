/**
 * AI Settings store — convenience helpers around Prisma for the AI engine
 * and the settings UI. Keeps all the upsert / merge logic in one place.
 */

import { db, safeQuery } from '@/lib/db';
import {
  detectAnomalies,
  forecastFailures,
  resolveSettings,
  type EffectiveAISettings,
  type PendingDetection,
  type PendingForecast,
} from './anomaly-engine';
import type {
  AIModelKind,
  AnomalyFeedback,
  Machine,
  Severity,
} from '@prisma/client';

/** Get-or-create the org settings row. Always returns a row. */
export async function getOrCreateOrgSettings(organizationId: string) {
  const existing = await safeQuery(
    () => db.orgAISettings.findUnique({ where: { organizationId } }),
    null,
  );
  if (existing) return existing;
  return db.orgAISettings.create({
    data: { organizationId },
  });
}

/** Update org settings. Caller must check authorization. */
export async function updateOrgSettings(
  organizationId: string,
  patch: Partial<{
    enabled: boolean;
    model: AIModelKind;
    sensitivity: number;
    minAlertSeverity: Severity;
    forecastHorizonDays: number;
    autoCreateWorkOrders: boolean;
    quietHoursStart: number | null;
    quietHoursEnd: number | null;
    alertChannelOverride: string | null;
    customInstructions: string | null;
  }>,
) {
  await getOrCreateOrgSettings(organizationId);
  return db.orgAISettings.update({
    where: { organizationId },
    data: patch,
  });
}

/** Get-or-create the machine settings row. */
export async function getOrCreateMachineSettings(machineId: string) {
  const existing = await safeQuery(
    () => db.machineAISettings.findUnique({ where: { machineId } }),
    null,
  );
  if (existing) return existing;
  return db.machineAISettings.create({ data: { machineId } });
}

export async function updateMachineSettings(
  machineId: string,
  patch: Partial<{
    enabled: boolean;
    model: AIModelKind | null;
    sensitivity: number | null;
    minAlertSeverity: Severity | null;
    forecastHorizonDays: number | null;
    thresholds: Record<string, { warn: number; crit: number; unit?: string }> | null;
    notes: string | null;
  }>,
) {
  await getOrCreateMachineSettings(machineId);
  return db.machineAISettings.update({
    where: { machineId },
    data: patch as any,
  });
}

/** Resolve the effective settings for a single machine. */
export async function getEffectiveSettings(
  organizationId: string,
  machineId: string,
): Promise<EffectiveAISettings> {
  const [org, machine] = await Promise.all([
    safeQuery(() => db.orgAISettings.findUnique({ where: { organizationId } }), null),
    safeQuery(() => db.machineAISettings.findUnique({ where: { machineId } }), null),
  ]);
  return resolveSettings(org as any, machine as any);
}

/**
 * Run the engine for a single machine. Reads recent SensorReadings,
 * persists any detections + matching Alerts, and returns a summary.
 *
 * Idempotent over a 5-minute window: if the same sensor type already
 * produced a detection within the last 5 minutes, we don't duplicate it.
 */
export async function runEngineForMachine(machine: Machine, lookbackHours = 24) {
  const settings = await getEffectiveSettings(machine.organizationId, machine.id);
  if (!settings.enabled) return { skipped: true, reason: 'disabled' as const };

  const cutoff = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
  const readings = await safeQuery(
    () =>
      db.sensorReading.findMany({
        where: { machineId: machine.id, recordedAt: { gte: cutoff } },
        orderBy: { recordedAt: 'asc' },
        take: 2000,
      }),
    [] as any[],
  );

  const detections = detectAnomalies(readings as any, settings);
  const forecasts = forecastFailures(machine, readings as any, settings);

  const dedupSince = new Date(Date.now() - 5 * 60 * 1000);
  const persistedDetections: PendingDetection[] = [];
  for (const d of detections) {
    const recent = await safeQuery(
      () =>
        db.anomalyDetection.findFirst({
          where: {
            machineId: machine.id,
            sensorType: d.sensorType,
            detectedAt: { gte: dedupSince },
          },
        }),
      null,
    );
    if (recent) continue;

    let alertId: string | null = null;
    if (d.shouldRaiseAlert) {
      const alert = await db.alert.create({
        data: {
          type: 'SENSOR_ANOMALY',
          title: `AI: ${d.sensorType} anomaly on ${machine.name}`,
          message: d.message + (d.recommendation ? `\n\nRecommendation: ${d.recommendation}` : ''),
          severity: d.severity,
          machineId: machine.id,
          organizationId: machine.organizationId,
        },
      });
      alertId = alert.id;
    }

    await db.anomalyDetection.create({
      data: {
        sensorType: d.sensorType,
        value: d.value,
        unit: d.unit,
        baseline: d.baseline,
        deviation: d.deviation,
        threshold: d.threshold,
        severity: d.severity,
        message: d.message,
        recommendation: d.recommendation,
        modelUsed: d.modelUsed,
        detectedAt: d.detectedAt,
        machineId: machine.id,
        organizationId: machine.organizationId,
        alertId,
      },
    });
    persistedDetections.push(d);
  }

  // Refresh forecasts: delete unexpired stale ones for this machine first.
  await safeQuery(
    () =>
      db.predictiveForecast.deleteMany({
        where: { machineId: machine.id, validUntil: { lt: new Date() } },
      }),
    null,
  );
  const persistedForecasts: PendingForecast[] = [];
  const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  for (const f of forecasts) {
    await db.predictiveForecast.create({
      data: {
        sensorType: f.sensorType,
        predictedFailureAt: f.predictedFailureAt,
        confidence: f.confidence,
        recommendation: f.recommendation,
        horizonDays: f.horizonDays,
        validUntil,
        machineId: machine.id,
        organizationId: machine.organizationId,
      },
    });
    persistedForecasts.push(f);
  }

  return {
    skipped: false as const,
    detections: persistedDetections,
    forecasts: persistedForecasts,
  };
}

export async function recordFeedback(
  detectionId: string,
  feedback: AnomalyFeedback,
) {
  return db.anomalyDetection.update({
    where: { id: detectionId },
    data: { feedback },
  });
}
