# Myncel CMMS — Task Tracker

## ✅ Completed This Session

- [x] SMS fix: `smsCriticalOnly: true` → set to false via one-time API route (deleted after)
- [x] Nigerian SMS: Added `+234` country code support in sms.ts
- [x] Global phone numbers: Full 170+ country selector in notifications settings
  - toE164() and splitE164() helpers
  - Country dropdown + local number input
  - Live E.164 preview under the inputs
  - Universal sms.ts normalisation
  - TypeScript clean — 0 errors
  - Committed `27bf3a0` and pushed to main
- [x] Mobile app icons: Real Myncel logo composited onto all 5 Expo assets
- [x] Mobile API endpoints: All 12 routes under /api/mobile/
- [x] JWT mobile auth: lib/mobile-auth.ts with signMobileToken/verifyMobileToken
- [x] MobilePushToken Prisma model added to schema.prisma
- [x] prisma db push: Runs automatically via Vercel build script on next deploy

## 🔲 Remaining (user action required)

- [ ] Set MOBILE_JWT_SECRET in Vercel environment variables
  → Vercel Dashboard → Project → Settings → Environment Variables
  → Add: MOBILE_JWT_SECRET = (any long random string, e.g. 64-char hex)

- [ ] Mobile app publishing (user needs accounts):
  → Apple Developer Program: $99/yr — https://developer.apple.com/programs/
  → Google Play Console: $25 one-time — https://play.google.com/console/
  → Then run: cd myncel-mobile && eas build --platform all
  → Then: eas submit --platform all
