# Myncel — Super Admin Full Control

## Phase 1: Database — AdminSetting model for global config
- [ ] Add AdminSetting model to Prisma schema (payment gateways, feature flags, org overrides)
- [ ] Add isActive/isSuspended/adminNotes fields to Organization model
- [ ] Create migration SQL

## Phase 2: Global Platform Settings (payment gateways toggle)
- [ ] Create app/admin/settings/platform/page.tsx — payment gateway toggles + global feature flags
- [ ] Create /api/admin/settings/route.ts — GET/PATCH global settings
- [ ] Add "Platform Settings" to admin nav

## Phase 3: Organization Full Control
- [ ] Upgrade /admin/organizations to link each org to detail page
- [ ] Create app/admin/organizations/[orgId]/page.tsx — full org control panel
- [ ] Create app/admin/organizations/[orgId]/OrgControlClient.tsx — all tabs
- [ ] Admin can: suspend/activate org, change plan, edit name/slug/industry, manage users, view all data
- [ ] Create API: PATCH /api/admin/organizations/[orgId]/route.ts

## Phase 4: User Full Control
- [ ] Upgrade /admin/users to be interactive (click user → detail)
- [ ] Create /api/admin/users/[userId]/route.ts — PATCH role, DELETE user, suspend

## Phase 5: Wire payment gateway toggles into BillingClient
- [ ] BillingClient reads active gateways from API and hides disabled ones
- [ ] Create /api/billing/gateways/route.ts — returns active payment gateways

## Phase 6: Build + commit
- [ ] TypeScript check
- [ ] Build check
- [ ] Commit and push