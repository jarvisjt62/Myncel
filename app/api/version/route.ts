import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Public version endpoint. Polled every 60 s by every connected client
 * (web + Capacitor mobile apps) so they can detect a deploy or a manual
 * Super-Admin "Force refresh all clients" event and reload themselves.
 *
 * The response is intentionally tiny (~80 bytes) and uncached so checks
 * stay fresh. The version itself is sourced (in priority order) from:
 *
 *   1. The `platform.appVersion` row in the `admin_settings` table
 *      (bumped manually by SA OR programmatically by the deploy hook).
 *   2. `process.env.VERCEL_GIT_COMMIT_SHA` — set automatically by Vercel.
 *   3. `process.env.APP_VERSION` — manual fallback for self-hosted.
 *   4. A hard-coded "dev" string for local development.
 *
 * Clients compare the returned `appVersion` against their stored value;
 * if they differ, they clear caches and call `window.location.reload()`.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  let appVersion: string;
  let bumpedAt: string | null = null;

  try {
    const row = await db.adminSetting.findUnique({
      where: { key: 'platform.appVersion' },
    });
    if (row) {
      // value is JSON-encoded — could be a plain string or { version, bumpedAt }
      try {
        const parsed = JSON.parse(row.value);
        if (typeof parsed === 'string') {
          appVersion = parsed;
        } else if (parsed && typeof parsed === 'object' && parsed.version) {
          appVersion = String(parsed.version);
          if (parsed.bumpedAt) bumpedAt = String(parsed.bumpedAt);
        } else {
          appVersion = String(parsed);
        }
      } catch {
        appVersion = row.value;
      }
      if (!bumpedAt) bumpedAt = row.updatedAt.toISOString();
    } else {
      appVersion =
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.APP_VERSION ||
        'dev';
    }
  } catch {
    // DB unreachable — fall back to env so a temporary outage doesn't
    // stampede every client into a reload loop.
    appVersion =
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.APP_VERSION ||
      'dev';
  }

  return NextResponse.json(
    { appVersion, bumpedAt },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    }
  );
}
