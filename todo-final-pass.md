# Final-pass todo (post Big Bets 1-4)

## 1) Comprehensive handbook + roadmap pass
- [ ] Audit every chapter for stale "on the roadmap" / "coming soon" wording for shipped features
- [ ] Verify every `/docs/*` link the handbook references actually exists as a page
- [ ] Cross-check Roadmap chapter against shipped commits — remove anything done
- [ ] Verify chapter numbering is sequential after AI insert
- [ ] Verify all callouts use only `'tip'|'warning'|'info'`
- [ ] Verify all `steps` are flat `string[]` (not `{label,text}[]`)
- [ ] Run `npx tsc --noEmit`
- [ ] Commit + push

## 2) Comprehensive mobile responsiveness audit
- [ ] Web app mobile (portrait + landscape) — every page
- [ ] Capacitor Android + iOS WebView — Samsung One UI status-bar floor everywhere
- [ ] Expo myncel-mobile — quick sanity pass
- [ ] Sticky toolbars, modals, bottom nav, scrolling containers, keyboard avoidance

## 3) Comprehensive bug fixes
- [ ] Run `npx tsc --noEmit` cleanly
- [ ] Run `npx next build` locally to catch route-level breakage
- [ ] Walk every shipped Big-Bet feature one more time
- [ ] Fix anything found
