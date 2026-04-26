# Myncel Implementation Tasks

## Phase 1 — Admin Feature Flags (Customers/Changelog toggle)
- [x] Create `/api/admin/feature-flags/route.ts` — GET/PUT feature flags
- [x] Update `SettingsClient.tsx` — add Feature Flags section with customers/changelog toggles
- [x] Update `customers/page.tsx` — check flag, show disabled page if off
- [x] Update `changelog/page.tsx` — check flag, show disabled page if off

## Phase 2 — Settings → Integrations UI (Connect Modals)
- [x] Rebuild `settings/integrations/page.tsx` with proper per-integration connect modals

## Phase 3 — OAuth Callback Routes
- [x] Create `/api/integrations/slack/callback/route.ts`
- [x] Create `/api/integrations/quickbooks/callback/route.ts`
- [x] Create `/api/integrations/google-sheets/callback/route.ts`

## Phase 4 — Notification Dispatch Utilities
- [x] Create `lib/notifications/slack.ts` — send Slack messages
- [x] Create `lib/notifications/sms.ts` — Twilio SMS dispatch
- [x] Create `lib/notifications/dispatch.ts` — unified dispatcher
- [x] Hook dispatch into work order API — fires on create/complete

## Phase 5 — Webhooks Management Page
- [x] Create `/app/settings/webhooks/page.tsx` — full CRUD UI

## Phase 6 — Advanced Features
- [x] Floor plan upload — `/app/equipment/floor-plan/page.tsx` + API
- [x] Barcode scanning — `/app/equipment/scan/page.tsx`
- [x] IoT sensor data ingestion API — `/api/iot/route.ts`
- [x] OEE tracking — `/app/analytics/oee/page.tsx`
- [x] Purchase Orders — `/app/purchase-orders/` full CRUD

## Phase 7 — PWA / Mobile
- [x] Add `public/manifest.json`
- [x] Add service worker registration

## Phase 8 — Docs/Guides Updates
- [x] Re-add IoT sensor section to equipment-lifespan guide

## Phase 9 — Fix & Ship
- [x] Fix IoT route build error (meterReading → totalHours, use SensorReading DB model)
- [x] Fix Alert creation (type/isRead/isResolved not status)
- [x] Fix dispatch.ts webhook filter (in-memory, not Prisma has)
- [x] Fix offline/page.tsx missing 'use client'
- [x] Hook dispatchNotifications into work order create/complete API
- [x] Run npm run build — ✓ Compiled successfully
- [x] git commit and push all changes