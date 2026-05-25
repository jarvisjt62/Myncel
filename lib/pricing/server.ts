/**
 * Server-side helpers for Phase 1 regional pricing.
 *
 * Uses Vercel's edge geo header `x-vercel-ip-country` (free, zero
 * latency, automatically populated on every request in production).
 * Falls back to USD when the header is missing — typically only
 * happens in local dev, where Vercel's edge is not in front of the
 * request.
 *
 * Why a separate file: client bundles must NOT include `next/headers`,
 * so this module is the only place that touches it. The Currency
 * catalog (lib/pricing/currencies.ts) stays universal.
 */

import { headers } from 'next/headers';
import { currencyForCountry } from './currencies';

export interface InitialPricingContext {
  /** ISO-3166 alpha-2 country detected from edge headers, uppercased. Null if unavailable. */
  country: string | null;
  /** Currency we'll display for this country. Always set; defaults to 'USD'. */
  currency: string;
  /** True if we resolved the currency from a country code (vs. falling back). */
  autoDetected: boolean;
}

export async function getInitialPricingContext(): Promise<InitialPricingContext> {
  try {
    const h = await headers();
    const country =
      h.get('x-vercel-ip-country') ||
      h.get('cf-ipcountry') || // future-proof if we move to Cloudflare
      null;
    const upper = country ? country.toUpperCase() : null;
    if (!upper) {
      return { country: null, currency: 'USD', autoDetected: false };
    }
    const currency = currencyForCountry(upper);
    return {
      country: upper,
      currency,
      autoDetected: currency !== 'USD' || upper === 'US',
    };
  } catch {
    return { country: null, currency: 'USD', autoDetected: false };
  }
}
