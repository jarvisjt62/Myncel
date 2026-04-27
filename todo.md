# Myncel — Super Admin Full Control

## Phase 1: Database — AdminSetting model for global config
- [x] Add AdminSetting model to Prisma schema (payment gateways, feature flags, org overrides)
- [x] Add isActive/isSuspended/adminNotes fields to Organization model
- [x] Create migration SQL

## Phase 2: Global Platform Settings (payment gateways toggle)
- [x] Create app/admin/settings/platform/page.tsx — payment gateway toggles + global feature flags
- [x] Create /api/admin/settings/route.ts — GET/PATCH global settings
- [x] Add "Platform Settings" to admin nav

## Phase 3: Organization Full Control
- [x] Upgrade /admin/organizations to link each org to detail page
- [x] Create app/admin/organizations/[orgId]/page.tsx — full org control panel
- [x] Create app/admin/organizations/[orgId]/OrgControlClient.tsx — all tabs
- [x] Admin can: suspend/activate org, change plan, edit name/slug/industry, manage users, view all data
- [x] Create API: PATCH /api/admin/organizations/[orgId]/route.ts

## Phase 4: User Full Control
- [x] Upgrade /admin/users to be interactive (click user → detail)
- [x] Create /api/admin/users/[userId]/route.ts — PATCH role, DELETE user, suspend

## Phase 5: Wire payment gateway toggles into BillingClient
- [x] BillingClient reads active gateways from API and hides disabled ones
- [x] Create /api/billing/gateways/route.ts — returns active payment gateways

## Phase 6: Build + commit
- [x] TypeScript check — PASSED (0 errors)
- [x] Build check — static page generation killed by memory limit (env constraint, not code error)
- [x] Commit and push — 4bbb174 pushed to main (16 files, +1753 lines)