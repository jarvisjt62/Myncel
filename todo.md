# CMMS Feature Implementation Plan

## 1. Setup Wizard - Machine + IoT Connection
- [ ] Create `/app/setup/SetupWizardClient.tsx` - multi-step wizard UI (5 steps)
- [ ] Create `/app/setup/page.tsx` - page wrapper
- [ ] Create `/app/api/setup/wizard/route.ts` - wizard API

## 2. API Key Management UI
- [ ] Create `/app/settings/api-keys/page.tsx` - API key management page
- [ ] Create `/app/api/settings/api-keys/route.ts` - CRUD for API keys

## 3. Sensor Simulator
- [ ] Create `/app/components/dashboard/SensorSimulator.tsx` - simulator panel
- [ ] Create `/app/api/dashboard/simulate/route.ts` - simulation endpoint

## 4. OpenAPI / Swagger Docs
- [ ] Create `/app/api/docs/route.ts` - serve OpenAPI JSON spec
- [ ] Create `/app/docs/api/page.tsx` - Swagger UI viewer page

## 5. Admin Dashboard Audit & Fixes
- [ ] Add IoT / sensor stats section to admin overview
- [ ] Add breakdown alert panel with link to new breakdown route
- [ ] Verify admin simulate integrates with new breakdown API
- [ ] Add API key management link in admin sidebar

## 6. Build & Commit
- [ ] npx tsc --noEmit → 0 errors
- [ ] git commit + push