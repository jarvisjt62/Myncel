/**
 * lib/reports/schedule.ts
 *
 * Compute the next-fire timestamp for a SavedReport given its
 * schedule kind, hour-of-day, and IANA timezone.
 *
 * We support DAILY / WEEKLY / MONTHLY firing at the user's chosen
 * `hourLocal` in the user's `timezone`. Vercel's serverless cron
 * can only run hourly granularity reliably, so we fire any report
 * whose `nextRunAt <= now()` from a single 15-min cron.
 */

export type ReportSchedule = 'NEVER' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

/**
 * Convert a UTC Date to the wall-clock hour in the given IANA timezone.
 * Returns NaN if the timezone is invalid.
 */
function hourInTz(date: Date, tz: string): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(fmt.format(date), 10);
  } catch {
    return NaN;
  }
}

/**
 * Returns the next UTC instant at which the given schedule should fire,
 * strictly AFTER `from`. Returns null for NEVER.
 *
 * Strategy: walk forward from `from` in 1-hour steps (max 24*32 = 768 iters
 * for monthly cadence). Cheap and timezone/DST-safe.
 */
export function computeNextRun(
  schedule: ReportSchedule,
  hourLocal: number,
  tz: string,
  from: Date = new Date(),
): Date | null {
  if (schedule === 'NEVER') return null;
  const safeHour = Math.max(0, Math.min(23, Math.floor(hourLocal)));
  const startMs = from.getTime();
  // Step in 15-minute slices to find the matching hour-of-day in the user TZ.
  const STEP_MS = 15 * 60 * 1000;
  // Cap iterations: 32 days * 96 slots/day = 3072
  const MAX_ITERS = 32 * 96;
  for (let i = 1; i <= MAX_ITERS; i++) {
    const candidate = new Date(startMs + i * STEP_MS);
    const candHour = hourInTz(candidate, tz);
    if (candHour !== safeHour) continue;

    // Check minute is 0–14 within this hour to avoid double-firing.
    const candMin = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: tz, minute: 'numeric' }).format(candidate),
      10,
    );
    if (candMin > 15) continue;

    // Schedule-specific day-of-week / day-of-month checks.
    const dayParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      day: 'numeric',
    }).formatToParts(candidate);
    const weekday = dayParts.find(p => p.type === 'weekday')?.value || '';
    const dayOfMonth = parseInt(dayParts.find(p => p.type === 'day')?.value || '0', 10);

    if (schedule === 'DAILY') return candidate;
    if (schedule === 'WEEKLY' && weekday === 'Mon') return candidate;
    if (schedule === 'MONTHLY' && dayOfMonth === 1) return candidate;
  }
  return null;
}
