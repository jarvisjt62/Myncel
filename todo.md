# Session 4 Fixes

## Issue 1: Dashboard tabs (Equipment/WorkOrders/Schedules/Alerts) not working
- [ ] Inspect DashboardClient.tsx tab switching logic
- [ ] Fix hash-based tab navigation and rendering

## Issue 2: User sidebar bottom section - replace with clean dropdown account menu
- [ ] Redesign bottom of UserSidebar: replace raw links with a proper dropdown
- [ ] Show avatar, name, role in a compact button
- [ ] Dropdown shows: Org Admin Panel (if OWNER/ADMIN), Admin Panel (if admin email), Sign out

## Issue 3: Speed up navigation in both admin and user dashboards
- [ ] Add prefetch support for key routes in UserSidebar
- [ ] Minimize layout re-renders on tab changes in DashboardClient
- [ ] Check for unnecessary dynamic imports slowing navigation

## Commit & Push
- [ ] Git commit and push all changes