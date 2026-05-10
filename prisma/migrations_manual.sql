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
