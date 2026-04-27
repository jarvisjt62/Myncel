# Multi-Role Team System — Technicians, Engineers & Org Admin

## Plan
The schema already has: OWNER, ADMIN, TECHNICIAN, MEMBER roles.
The system needs:
1. Invite flow — org admin invites technicians via email with a secure token link
2. Join page — technician clicks link, sets password, joins org automatically  
3. Technician dashboard — role-aware: sees only assigned work orders, alerts for their machines
4. Org admin panel — /org/dashboard — manage team, assign tasks, view all WOs/alerts
5. Notifications & email — WO assigned → in-app notification + email to technician
6. Role-aware sidebar — technicians see limited menu; admins/owners see full menu

## Tasks

### Phase 1 — Database & Backend
- [ ] Add InviteToken model to Prisma schema
- [ ] Create /api/team/invite route — generate secure token, send invite email
- [ ] Create /api/team/join route — validate token, create user, link to org
- [ ] Update /api/work-orders route — auto-notify technician on assignment
- [ ] Add email templates: invite email, work-order-assigned email, alert email

### Phase 2 — Pages
- [ ] Create /join/[token] page — technician self-registers via invite link
- [ ] Create /org/dashboard page — org admin panel (team, WOs, alerts, machines)
- [ ] Update /settings/team page — full invite + role management UI
- [ ] Update dashboard sidebar — role-aware nav (technician vs admin/owner view)

### Phase 3 — Notifications
- [ ] Create notification trigger helper lib (notifyUser)
- [ ] Wire WO assignment to send in-app + email notification
- [ ] Wire machine alerts to notify relevant technicians

### Phase 4 — Commit & Push
- [ ] TypeScript check (0 errors)
- [ ] Git commit and push