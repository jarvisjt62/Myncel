# RBAC Enforcement + UI Gating

## Infrastructure
- [x] `/api/me/permissions` endpoint
- [x] `PermissionsProvider` + `usePermissions()` + `<Can>` component
- [x] Provider wired in DashboardClient, AdminLayoutClient, UserSidebar
- [x] Typecheck clean

## Task 1 — Server-side enforcement
- [x] `/api/work-orders` POST → `work_orders.create`
- [x] `/api/work-orders/[id]` PATCH → edit/close/assign; DELETE → delete
- [x] `/api/machines` POST → `machines.create`; PATCH/DELETE per-id
- [x] `/api/parts` POST → `parts.create`; PUT (edit/adjust_stock)/DELETE per-id
- [x] `/api/maintenance-tasks` POST/PATCH/DELETE → schedules.*
- [x] `/api/team/invite` POST/DELETE → `team.invite`
- [x] `/api/team/[id]` PATCH → `team.edit_roles`; DELETE → `team.remove`
- [x] `guardPermission` helper in lib/permissions.ts

## Task 2 — UI gating
- [x] Wrap Create Work Order / Machine / Part / Task buttons
- [x] Wrap Delete/Edit actions in DashboardClient rows and modals
- [x] Wrap Invite Team Member buttons in OrgDashboardClient
- [x] Disable role-change select when missing team.edit_roles

## Verification
- [x] Typecheck clean
- [ ] Commit + push
