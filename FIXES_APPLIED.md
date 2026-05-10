# Database & Auth Stability Fixes — Applied 2026-04-24

## Root Causes Fixed

### 1. Multiple Rogue PrismaClient Instances (Critical)
**Problem:** 4 files were creating `new PrismaClient()` directly, bypassing the port 5432→6543 fix in `lib/db.ts`:
- `app/api/export/route.ts`
- `app/api/search/route.ts`  
- `app/api/analytics/route.ts`
- `app/api/maintenance/generate-work-orders/route.ts`
- `lib/audit.ts` (used by many routes)

**Fix:** All replaced with `import { db } from '@/lib/db'` to use the shared, correctly-configured instance.

### 2. Improved getDatabaseUrl() in lib/db.ts (Critical)
**Problem:** The old string-based URL replacement was fragile and could fail on URLs with different query string formats.

**Fix:** Rewrote using `new URL()` parser for robust port switching:
- Properly parses URL, detects port 5432
- Switches to 6543 (transaction mode pooler)
- Sets `pgbouncer=true` and `connection_limit=1` parameters
- Falls back to string replacement if URL parsing fails

### 3. Missing `force-dynamic` on Auth Route (Critical)
**Problem:** `app/api/auth/[...nextauth]/route.ts` was missing `export const dynamic = 'force-dynamic'`, allowing Vercel to potentially cache auth responses.

**Fix:** Added `export const dynamic = 'force-dynamic'`.

### 4. Missing `force-dynamic` on 29 API Routes (Important)
**Problem:** All DB-querying API routes were missing `force-dynamic`, meaning Vercel could serve stale cached responses.

**Fix:** Added `export const dynamic = 'force-dynamic'` to all 29 affected routes.

### 5. Admin Dashboard Pages (Previously Fixed)
All 7 admin pages already had `force-dynamic` added in a previous session.

## Current State (Verified)
- ✅ DB connected via port 6543 (transaction mode - no pool exhaustion)
- ✅ `admin@myncel.com` password: `Emperor1980&`
- ✅ `kellytron@yahoo.com` password: `Emperor1980&`
- ✅ 5/5 consecutive DB checks pass consistently
- ✅ Both login endpoints return HTTP 302 (success)
- ✅ Build passes with 0 errors/warnings

## Vercel Environment Note
The Vercel `DATABASE_URL` still shows port 5432 in env vars, but `lib/db.ts` 
automatically switches it to 6543 at runtime. If you want to fix it permanently 
in the Vercel dashboard:
- Go to Vercel → Project → Settings → Environment Variables
- Update `DATABASE_URL` to use port 6543 with `?pgbouncer=true&connection_limit=1`
