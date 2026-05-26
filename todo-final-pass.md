# Final-pass todo (post Big Bets 1-4)

## 1) Comprehensive handbook + roadmap pass — ✅ DONE (commit 68ccb37)
- [x] Audit every chapter for stale "on the roadmap" / "coming soon" wording for shipped features
- [x] Verify every `/docs/*` link the handbook references actually exists as a page
- [x] Cross-check Roadmap chapter against shipped commits — remove "AI Settings panel per machine"
- [x] Cross-link Alerts chapter to AI chapter
- [x] Update Predictive chapter (#4) to point at /settings/ai walkthrough
- [x] Add 🤖 AI & Predictive Maintenance card to /docs hub
- [x] Verify all callouts use only `'tip'|'warning'|'info'`
- [x] Verify all `steps` are flat `string[]`
- [x] tsc clean

## 2) Comprehensive mobile responsiveness audit — ✅ DONE (commit a6c85a8)
- [x] Web app mobile audit (portrait/landscape) — modal-safe-pad in place, viewport-fit:cover globally
- [x] Capacitor Android + iOS — Samsung One UI status-bar floor verified app-wide
- [x] Toast safe-area pass — global CSS override of fixed.bottom-{4,6} + fixed.right-{4,6}
- [x] Admin bottom nav — paddingBottom respects env(safe-area-inset-bottom)
- [x] AI panels (workspace + per-machine + SuperAdmin) — verified responsive grid layouts

## 3) Comprehensive bug fixes — ✅ DONE (commit a6c85a8)
- [x] tsc --noEmit clean
- [x] next build clean (all 130+ routes compile)
- [x] No new console.log / debug statements
- [x] AI files ship without errors
