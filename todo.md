# Myncel App — Task Log

## ✅ Task 1: Fix Admin Dashboard "Something Went Wrong" Error — COMPLETE (ad8b687)
## ✅ Task 2: Persistent Sidebar Navigation Across All Pages — COMPLETE (c62aa50)

## ✅ Task 3: UI Fixes — April 27 — COMPLETE (ef3f7d5)

### Fix 1 — Sidebar bottom section visibility
- [x] Remove duplicate `dash-theme` class from inner shell div (was blocking dark mode)
- [x] Role text now uses accent color (was too faint with text-muted)
- [x] Org Admin Panel link uses text-primary with opacity (was invisible)
- [x] Sign out button more visible (text-secondary + hover:red + hover bg)
- [x] Added ThemeToggle to topbar so dark/light switch is always accessible

### Fix 2 — Quick Action buttons (were causing 404)
- [x] New Work Order → /dashboard#work-orders
- [x] Schedule PM → /dashboard#schedules
- [x] Add Machine → /dashboard#equipment
- [x] View Alerts → /dashboard#alerts
- [x] Settings → /settings
- [x] DashboardClient now reads URL hash to activate the right tab

### Fix 3 — Invite Team Member modal transparency
- [x] Modal z-index raised to 9999
- [x] Background uses `var(--bg-surface, #ffffff)` with solid fallback
- [x] Form inputs use fallback colors for guaranteed visibility

### Fix 4 — Dark mode sync across all pages
- [x] UserSidebar: removed duplicate dash-theme (was preventing data-theme from cascading)
- [x] All hardcoded light colors (#0a2540, #425466, #f6f9fc, #e6ebf1) replaced with CSS vars
- [x] settings/: integrations, notifications, security, team, webhooks, api-keys
- [x] equipment/: qr-labels, floor-plan, scan
- [x] docs/: category and slug pages
- [x] Removed min-h-screen wrappers from settings sub-pages