-- ============================================================================
-- Big Bet #4 — AI Settings panel + anomaly detection + predictive forecasts
-- Schema migration for Supabase (Postgres)
--
-- Idempotent: safe to re-run. Uses IF NOT EXISTS / DO blocks throughout.
-- Run this in Supabase Studio → SQL Editor → New query → Paste → Run.
--
-- Adds:
--   * 2 enums: "AIModelKind", "AnomalyFeedback"
--   * 2 new values on existing "AlertType" enum: SENSOR_ANOMALY, PREDICTIVE_FAILURE
--   * 4 tables: org_ai_settings, machine_ai_settings, anomaly_detections, predictive_forecasts
--   * Indexes + foreign keys
-- ============================================================================

-- ---------------------------------------------------------------------------
-- STEP A — Enum value additions to existing AlertType.
-- These MUST run outside a transaction in some Postgres versions, so we run
-- them first, before any BEGIN. Supabase SQL editor handles this fine.
-- ---------------------------------------------------------------------------

ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'SENSOR_ANOMALY';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'PREDICTIVE_FAILURE';

-- ---------------------------------------------------------------------------
-- STEP B — Everything else, in a single transaction so it's all-or-nothing.
-- ---------------------------------------------------------------------------

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. NEW ENUMS
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AIModelKind') THEN
    CREATE TYPE "AIModelKind" AS ENUM ('STATISTICAL', 'HYBRID', 'LLM_ASSISTED');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnomalyFeedback') THEN
    CREATE TYPE "AnomalyFeedback" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- 2. org_ai_settings
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "org_ai_settings" (
  "id"                    TEXT PRIMARY KEY,
  "enabled"               BOOLEAN       NOT NULL DEFAULT TRUE,
  "model"                 "AIModelKind" NOT NULL DEFAULT 'STATISTICAL',
  "sensitivity"           INTEGER       NOT NULL DEFAULT 50,
  "minAlertSeverity"      "Severity"    NOT NULL DEFAULT 'LOW',
  "forecastHorizonDays"   INTEGER       NOT NULL DEFAULT 30,
  "autoCreateWorkOrders"  BOOLEAN       NOT NULL DEFAULT FALSE,
  "quietHoursStart"       INTEGER,
  "quietHoursEnd"         INTEGER,
  "alertChannelOverride"  TEXT,
  "customInstructions"    TEXT,
  "organizationId"        TEXT          NOT NULL,
  "createdAt"             TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3)  NOT NULL,
  CONSTRAINT "org_ai_settings_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "org_ai_settings_organizationId_key"
  ON "org_ai_settings"("organizationId");

-- ---------------------------------------------------------------------------
-- 3. machine_ai_settings
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "machine_ai_settings" (
  "id"                    TEXT PRIMARY KEY,
  "enabled"               BOOLEAN       NOT NULL DEFAULT TRUE,
  "model"                 "AIModelKind",
  "sensitivity"           INTEGER,
  "minAlertSeverity"      "Severity",
  "forecastHorizonDays"   INTEGER,
  "thresholds"            JSONB,
  "notes"                 TEXT,
  "machineId"             TEXT          NOT NULL,
  "createdAt"             TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3)  NOT NULL,
  CONSTRAINT "machine_ai_settings_machineId_fkey"
    FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "machine_ai_settings_machineId_key"
  ON "machine_ai_settings"("machineId");

-- ---------------------------------------------------------------------------
-- 4. anomaly_detections
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "anomaly_detections" (
  "id"             TEXT PRIMARY KEY,
  "sensorType"     TEXT              NOT NULL,
  "value"          DOUBLE PRECISION  NOT NULL,
  "unit"           TEXT,
  "baseline"       DOUBLE PRECISION,
  "deviation"      DOUBLE PRECISION,
  "threshold"      DOUBLE PRECISION,
  "severity"       "Severity"        NOT NULL,
  "message"        TEXT              NOT NULL,
  "recommendation" TEXT,
  "feedback"       "AnomalyFeedback" NOT NULL DEFAULT 'PENDING',
  "modelUsed"      "AIModelKind"     NOT NULL,
  "detectedAt"     TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "alertId"        TEXT,
  "machineId"      TEXT              NOT NULL,
  "organizationId" TEXT              NOT NULL,
  CONSTRAINT "anomaly_detections_alertId_fkey"
    FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "anomaly_detections_machineId_fkey"
    FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "anomaly_detections_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "anomaly_detections_organizationId_detectedAt_idx"
  ON "anomaly_detections"("organizationId", "detectedAt");

CREATE INDEX IF NOT EXISTS "anomaly_detections_machineId_sensorType_detectedAt_idx"
  ON "anomaly_detections"("machineId", "sensorType", "detectedAt");

-- ---------------------------------------------------------------------------
-- 5. predictive_forecasts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "predictive_forecasts" (
  "id"                  TEXT PRIMARY KEY,
  "sensorType"          TEXT          NOT NULL,
  "predictedFailureAt"  TIMESTAMP(3),
  "confidence"          INTEGER       NOT NULL,
  "recommendation"      TEXT          NOT NULL,
  "horizonDays"         INTEGER       NOT NULL,
  "generatedAt"         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil"          TIMESTAMP(3)  NOT NULL,
  "machineId"           TEXT          NOT NULL,
  "organizationId"      TEXT          NOT NULL,
  CONSTRAINT "predictive_forecasts_machineId_fkey"
    FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "predictive_forecasts_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "predictive_forecasts_organizationId_generatedAt_idx"
  ON "predictive_forecasts"("organizationId", "generatedAt");

CREATE INDEX IF NOT EXISTS "predictive_forecasts_machineId_sensorType_generatedAt_idx"
  ON "predictive_forecasts"("machineId", "sensorType", "generatedAt");

COMMIT;

-- ============================================================================
-- Done. Verify with:
--
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--     AND table_name IN ('org_ai_settings','machine_ai_settings','anomaly_detections','predictive_forecasts')
--   ORDER BY table_name;
--
-- Should return 4 rows.
-- ============================================================================
