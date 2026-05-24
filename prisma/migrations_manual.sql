-- Create enums
DO $$ BEGIN
    CREATE TYPE "IntegrationType" AS ENUM ('SLACK', 'QUICKBOOKS', 'ZAPIER', 'TWILIO', 'GOOGLE_SHEETS', 'WEBHOOKS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "IntegrationStatus" AS ENUM ('PENDING', 'CONNECTED', 'DISCONNECTED', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EmailDigestFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'NEVER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create integrations table
CREATE TABLE IF NOT EXISTS "integrations" (
    "id" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'PENDING',
    "config" JSONB,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "webhookUrl" TEXT,
    "callbackUrl" TEXT,
    "connectedAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- Create webhooks table
CREATE TABLE IF NOT EXISTS "webhooks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "events" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS "notification_settings" (
    "id" TEXT NOT NULL,
    "emailWorkOrders" BOOLEAN NOT NULL DEFAULT true,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "emailReports" BOOLEAN NOT NULL DEFAULT true,
    "emailDigest" "EmailDigestFrequency" NOT NULL DEFAULT 'WEEKLY',
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsWorkOrders" BOOLEAN NOT NULL DEFAULT false,
    "smsAlerts" BOOLEAN NOT NULL DEFAULT false,
    "smsCriticalOnly" BOOLEAN NOT NULL DEFAULT true,
    "phoneNumber" TEXT,
    "slackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "slackWorkOrders" BOOLEAN NOT NULL DEFAULT false,
    "slackAlerts" BOOLEAN NOT NULL DEFAULT false,
    "slackChannel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "integrations_organizationId_type_key" ON "integrations"("organizationId", "type");
CREATE UNIQUE INDEX IF NOT EXISTS "notification_settings_organizationId_key" ON "notification_settings"("organizationId");

-- Add indexes
CREATE INDEX IF NOT EXISTS "webhooks_organizationId_isActive_idx" ON "webhooks"("organizationId", "isActive");

-- Add foreign keys
DO $$ BEGIN
    ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organizationId_fkey"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_organizationId_fkey"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_integrationId_fkey"
        FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_organizationId_fkey"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('integrations', 'webhooks', 'notification_settings');
-- AdminSetting table
CREATE TABLE IF NOT EXISTS "admin_settings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "group" TEXT NOT NULL DEFAULT 'general',
  "label" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT
);

-- Organization admin control fields
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "adminNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "suspendedReason" TEXT;

-- Organization localization (currency)
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';

-- Per-entry currency (Option A: each cost remembers its own currency).
-- Backfill existing rows with the org's current currency, then default new rows to 'USD'.
ALTER TABLE "work_orders"
  ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';

ALTER TABLE "parts"
  ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';

ALTER TABLE "maintenance_tasks"
  ADD COLUMN IF NOT EXISTS "estimatedCost" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';

-- Backfill: stamp each existing row with its org's currency
UPDATE "work_orders" wo
   SET "currency" = COALESCE(o."currency", 'USD')
  FROM "organizations" o
 WHERE wo."organizationId" = o."id"
   AND (wo."currency" IS NULL OR wo."currency" = 'USD');

UPDATE "parts" p
   SET "currency" = COALESCE(o."currency", 'USD')
  FROM "organizations" o
 WHERE p."organizationId" = o."id"
   AND (p."currency" IS NULL OR p."currency" = 'USD');

UPDATE "maintenance_tasks" mt
   SET "currency" = COALESCE(o."currency", 'USD')
  FROM "organizations" o
 WHERE mt."organizationId" = o."id"
   AND (mt."currency" IS NULL OR mt."currency" = 'USD');

-- ===========================================================================
-- 2026-XX-XX  Notification system extension (push channels + quiet hours +
--             EMERGENCY / REMOTE_SUPPORT_SCHEDULED enum values)
-- Safe to run multiple times. No data loss.
-- ===========================================================================

-- 1. Add new NotificationType enum values (idempotent in Postgres 12+)
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EMERGENCY';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REMOTE_SUPPORT_SCHEDULED';

-- 2. Push channel toggles on notification_settings
ALTER TABLE "notification_settings"
  ADD COLUMN IF NOT EXISTS "pushEnabled"       BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "pushWorkOrders"    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "pushAlerts"        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "pushEmergency"     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "pushMaintenance"   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "pushParts"         BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "pushRemoteSupport" BOOLEAN NOT NULL DEFAULT true;

-- 3. Quiet hours fields on notification_settings
ALTER TABLE "notification_settings"
  ADD COLUMN IF NOT EXISTS "quietHoursEnabled"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "quietHoursStart"    TEXT,
  ADD COLUMN IF NOT EXISTS "quietHoursEnd"      TEXT,
  ADD COLUMN IF NOT EXISTS "quietHoursTimezone" TEXT NOT NULL DEFAULT 'America/New_York';

-- ===========================================================
-- Account Deletion (Apple App Review Guideline 5.1.1(v))
-- 2026-05-24 — added in fix/apple-resubmission branch
-- ===========================================================
-- Adds a single nullable timestamp column on users. When set, the
-- account is in the 14-day grace period and login is blocked. The
-- /api/cron/purge-deleted-accounts endpoint hard-deletes rows where
-- this is older than 14 days.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "users_deletionRequestedAt_idx"
  ON "users" ("deletionRequestedAt")
  WHERE "deletionRequestedAt" IS NOT NULL;
