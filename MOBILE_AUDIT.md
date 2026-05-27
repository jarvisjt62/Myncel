# Mobile App Comprehensive Audit & Fix Plan

## Strategy
Web + mobile-web work. Capacitor shell breaks. So all bugs come from the
delta between a normal browser tab and a fullscreen Android WebView. We fix
each category of delta systematically, in batches. No more whack-a-mole.

## Tasks

### Phase 1 — Audit (read code, find every offender)
- [x] Pull latest from origin
- [x] Inventory every fixed/sticky/absolute element in the app (118)
- [x] Inventory every modal/overlay (60)
- [x] Inventory every full-height container (123 h-screen, 123 min-h-screen)
- [x] Inventory every horizontal-scroll-prone container (64 tables, 57 overflow-x)
- [x] Snapshot current globals.css + layout.tsx Capacitor rules

### Phase 2 — Universal Foundations (commit 3371239) ✅
- [x] Replace 100vh with 100dvh everywhere via .capacitor-app overrides
- [x] Add overflow-x: hidden on root inside .capacitor-app
- [x] All fixed-bottom/top elements safe-area aware
- [x] Min 44×44px touch targets (icon-only forced; tab-style min-height only)
- [x] touch-action: manipulation on all interactive elements
- [x] Native-feel: no text selection on UI chrome, transparent tap-highlight
- [x] iOS-style overscroll bounce disabled on root
- [x] Scrollbars hidden in .capacitor-app
- [x] Inputs floored at 16px font + 44px min-height
- [x] :active state tactile feedback (opacity/scale)
- [x] Sticky headers guaranteed below safe-area
- [x] Modal backdrops scroll vertically (so tall modals are reachable)
- [x] Toasts/alerts always below status bar
- [x] Charts/canvas/img capped at 100% width; data-fixed-size opt-out

### Phase 3 — Targeted Fixes (commit 2723199) ✅
- [x] UserSidebar: auto-close drawer on route change (defense-in-depth)
- [x] UserSidebar: Escape key closes drawer + account menu
- [x] QR labels: Capacitor-aware print fallback (no more silent fail)
- [x] QR images marked data-fixed-size

### Phase 4 — Verify (USER ACTION REQUIRED)
- [ ] User installs new app build, retests on Samsung + Sony
- [ ] User confirms which categories are still buggy
- [ ] User confirms portrait vs landscape

### Phase 5 — Pending (will tackle after user feedback)
- [ ] Loading spinners centered with safe-areas
- [ ] Charts (recharts) responsive container audit
- [ ] Form keyboard-avoidance (scroll-into-view on focus)
- [ ] Tables with sticky-first-column for narrow screens
- [ ] Visible scroll affordance (gradient fade) on horizontal scrollers
- [ ] Specific component pages user flags as still broken
