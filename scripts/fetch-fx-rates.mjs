#!/usr/bin/env node
/**
 * Fetch latest USD-base FX rates and bake them into
 * `lib/pricing/fx-rates.json`. Run automatically by Vercel via the
 * `prebuild` npm script, so every production deploy ships rates that
 * are at most a few hours old. No API key required.
 *
 * Source: https://open.er-api.com/v6/latest/USD
 *   - Free, MIT licensed, ~daily refresh, no auth.
 *   - Mirrors the official European Central Bank reference rates with
 *     a couple of extra mid-market currencies.
 *
 * If the fetch fails (network error or upstream is down), we keep the
 * existing committed JSON instead of writing an empty file. The site
 * therefore never ends up with broken pricing — the worst case is
 * slightly stale rates.
 *
 * Usage:
 *   node scripts/fetch-fx-rates.mjs
 *   npm run prebuild
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'lib', 'pricing', 'fx-rates.json');

const ENDPOINT = 'https://open.er-api.com/v6/latest/USD';

// Currencies we display on /pricing — keep this in sync with
// SUPPORTED_CURRENCIES in lib/pricing/currencies.ts. Anything not in
// the list is dropped from the JSON to keep the bundle tiny.
const KEEP = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'CHF',
  'SEK', 'NOK', 'DKK', 'PLN',
  'JPY', 'CNY', 'HKD', 'SGD', 'TWD', 'KRW',
  'INR', 'PHP', 'MYR', 'THB', 'IDR', 'VND', 'BDT', 'PKR',
  'AED', 'SAR', 'ILS', 'EGP', 'TRY',
  'MXN', 'BRL', 'ARS', 'COP', 'CLP',
  'ZAR', 'NGN', 'KES', 'GHS',
];

async function main() {
  console.log(`[fx] Fetching latest USD rates from ${ENDPOINT}…`);

  let upstream;
  try {
    const res = await fetch(ENDPOINT, {
      headers: { 'User-Agent': 'Myncel-FXFetch/1.0' },
      // Reasonable build-time timeout
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    upstream = await res.json();
  } catch (err) {
    console.warn(`[fx] Fetch failed (${err?.message || err}). Keeping existing fx-rates.json.`);
    // Verify the existing file is at least valid JSON before exiting OK
    try {
      const existing = await fs.readFile(OUT, 'utf8');
      JSON.parse(existing);
      console.warn('[fx] Existing fx-rates.json is valid — build will use cached rates.');
      return;
    } catch (e) {
      console.error('[fx] No valid existing fx-rates.json — failing build.');
      process.exitCode = 1;
      return;
    }
  }

  if (upstream?.result !== 'success' || !upstream.rates) {
    console.error('[fx] Upstream payload unexpected:', upstream?.result);
    process.exitCode = 1;
    return;
  }

  const filtered = {};
  for (const code of KEEP) {
    if (typeof upstream.rates[code] === 'number') {
      filtered[code] = upstream.rates[code];
    }
  }
  filtered.USD = 1; // belt-and-suspenders

  const payload = {
    base: 'USD',
    fetchedAt: new Date().toISOString(),
    upstreamUpdatedAt: upstream.time_last_update_utc || null,
    source: 'open.er-api.com',
    rates: filtered,
  };

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  console.log(`[fx] Wrote ${Object.keys(filtered).length} rates → ${path.relative(path.resolve(__dirname, '..'), OUT)}`);
}

main().catch(err => {
  console.error('[fx] Unexpected error:', err);
  process.exit(1);
});
