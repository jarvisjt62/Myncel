# Mobile App Comprehensive Audit & Fix Plan

## Strategy
Web + mobile-web work. Capacitor shell breaks. So all bugs come from the
delta between a normal browser tab and a fullscreen Android WebView. We fix
each category of delta systematically, in batches. No more whack-a-mole.

## Tasks

### Phase 1 — Audit (read code, find every offender)
- [x] Pull latest from origin
- [ ] Inventory every fixed/sticky/absolute element in the app
- [ ] Inventory every modal/overlay
- [ ] Inventory every full-height container (`h-screen`, `min-h-screen`, `100vh`)
- [ ] Inventory every horizontal-scroll-prone container (tables, wide rows)
- [ ] Inventory every form/input pattern
- [ ] Snapshot current `globals.css` + `layout.tsx` Capacitor rules

### Phase 2 — Universal Foundations (one commit, fixes 60% of bugs)
- [ ] Replace `100vh` with `100dvh` everywhere (Android WebView resizes on keyboard)
- [ ] Add `overflow-x: hidden` on `html` and `body` (kills horizontal scroll bugs)
- [ ] Make ALL fixed-bottom/top elements safe-area aware (extend existing rules)
- [ ] Force minimum 44×44px touch targets on icon buttons
- [ ] Add `touch-action: manipulation` on tappable elements (kills 300ms delay + double-tap zoom)
- [ ] Disable text selection on UI chrome (buttons, headers, nav) — feels native
- [ ] Disable iOS-style overscroll bounce on root (`overscroll-behavior: none`)
- [ ] Hide scrollbars in Capacitor (Android shows them; mobile-web doesn't)
- [ ] Use `100svh` for hero/login splash (small viewport height, stable across keyboard)

### Phase 3 — Modals (the most common offender)
- [ ] Audit every `.fixed.inset-0` modal — should ALL have `modal-safe-pad` + scrollable inner content
- [ ] Modals must be vertically scrollable when content > viewport height
- [ ] Modal content max-height = `calc(100dvh - safe-areas - margins)`
- [ ] Tap-outside-to-close should respect safe areas (not trigger on system gesture areas)

### Phase 4 — Tables & Data Lists
- [ ] Wrap every `<table>` in a horizontally-scrollable container with `-webkit-overflow-scrolling: touch`
- [ ] Add visible scroll affordance (gradient fade on right edge) to indicate horizontal scroll
- [ ] Sticky first column for wide tables on narrow screens
- [ ] Card-list fallback below 480px breakpoint where it makes sense

### Phase 5 — Forms & Keyboard
- [ ] All inputs `font-size >= 16px` (prevents iOS zoom — also good for Android)
- [ ] All inputs `min-height: 44px` for tap target
- [ ] Visual viewport API: scroll focused input into view on Android keyboard open
- [ ] `inputmode` and `autocomplete` attributes audit
- [ ] Submit buttons must be reachable above the keyboard

### Phase 6 — Sidebar / Drawer / Bottom Nav
- [ ] Drawer must overlay content fully (z-index audit)
- [ ] Drawer close on backdrop tap, ESC, route change
- [ ] Drawer respects safe-area-top for header
- [ ] Drawer respects safe-area-bottom for footer items
- [ ] Bottom nav (if any) sits above gesture bar with safe-area-bottom

### Phase 7 — Landscape-Specific
- [ ] Safe-area-left and safe-area-right (notch/punchhole on landscape Samsung)
- [ ] Headers don't overflow in landscape
- [ ] Modals don't become unscrollable in short landscape viewports
- [ ] Login/splash centers correctly in landscape

### Phase 8 — QR Labels Screen (user-flagged)
- [ ] Audit `/qr-labels` (or wherever it lives) specifically
- [ ] Print/preview behavior in WebView
- [ ] Layout reflow on orientation change

### Phase 9 — Polish
- [ ] Loading spinners centered with safe-areas
- [ ] Toasts/snackbars positioned above bottom safe area
- [ ] Focus rings visible but not ugly on touch
- [ ] Disable pull-to-refresh on root (not on scroll containers — those keep it)
- [ ] Active button state (`:active`) gives tactile feedback

### Phase 10 — Verification
- [ ] Test every fix in `?capacitor-preview=1` mode
- [ ] User installs new app build, retests on Samsung + Sony
- [ ] Iterate on remaining issues
