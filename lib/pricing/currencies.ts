/**
 * Regional pricing — currency catalog and conversion helpers.
 *
 * USD is the source of truth. Stripe Adaptive Pricing converts at
 * checkout, so this module's job is purely DISPLAY: pick the right
 * currency for the visitor and format the converted amount nicely.
 *
 * Design:
 *   - SUPPORTED_CURRENCIES drives the manual selector dropdown.
 *   - COUNTRY_TO_CURRENCY maps Vercel's `x-vercel-ip-country` 2-letter
 *     code to a currency from the supported list. Anything not mapped
 *     falls back to USD.
 *   - convertUsdToLocal() does FX + psychological rounding so $49 USD
 *     comes out as a clean local-feeling number (e.g. ₱2,990, not
 *     ₱3,022.97).
 *   - format() uses Intl.NumberFormat with the currency's natural
 *     decimal places (USD/EUR = 2 decimals, JPY/KRW/IDR/CLP = 0).
 *
 * IMPORTANT: this module is safe to import from BOTH client and
 * server. It has no Node-only deps.
 */

import fxRates from './fx-rates.json';

// ----------------------------------------------------------------------
// Supported currency catalog
// ----------------------------------------------------------------------

export interface CurrencyDef {
  code: string;          // ISO-4217
  symbol: string;        // What we render before the number
  name: string;          // Human-readable name for the dropdown
  flag: string;          // Emoji flag of the currency's primary country
  /** Step used by the psychological-rounding logic */
  roundTo: number;
  /** Number of decimals shown by Intl.NumberFormat */
  decimals: 0 | 2;
  /**
   * Where the symbol appears in the formatted string. Almost everywhere
   * is 'before' (e.g. $49) but a handful of currencies feel more
   * natural with the symbol after the number. We keep this conservative
   * because Intl.NumberFormat already places the symbol correctly for
   * the user's locale; we override only when symbol layout matters
   * for the marketing aesthetic.
   */
  symbolPosition: 'before' | 'after';
}

export const SUPPORTED_CURRENCIES: CurrencyDef[] = [
  { code: 'USD', symbol: '$',     name: 'US Dollar',         flag: '🇺🇸', roundTo: 1,    decimals: 2, symbolPosition: 'before' },
  { code: 'EUR', symbol: '€',     name: 'Euro',              flag: '🇪🇺', roundTo: 1,    decimals: 2, symbolPosition: 'before' },
  { code: 'GBP', symbol: '£',     name: 'British Pound',     flag: '🇬🇧', roundTo: 1,    decimals: 2, symbolPosition: 'before' },
  { code: 'CAD', symbol: 'CA$',   name: 'Canadian Dollar',   flag: '🇨🇦', roundTo: 1,    decimals: 2, symbolPosition: 'before' },
  { code: 'AUD', symbol: 'A$',    name: 'Australian Dollar', flag: '🇦🇺', roundTo: 1,    decimals: 2, symbolPosition: 'before' },
  { code: 'NZD', symbol: 'NZ$',   name: 'New Zealand Dollar',flag: '🇳🇿', roundTo: 1,    decimals: 2, symbolPosition: 'before' },
  { code: 'CHF', symbol: 'CHF ',  name: 'Swiss Franc',       flag: '🇨🇭', roundTo: 1,    decimals: 2, symbolPosition: 'before' },
  { code: 'SEK', symbol: 'kr ',   name: 'Swedish Krona',     flag: '🇸🇪', roundTo: 5,    decimals: 0, symbolPosition: 'before' },
  { code: 'NOK', symbol: 'kr ',   name: 'Norwegian Krone',   flag: '🇳🇴', roundTo: 5,    decimals: 0, symbolPosition: 'before' },
  { code: 'DKK', symbol: 'kr ',   name: 'Danish Krone',      flag: '🇩🇰', roundTo: 5,    decimals: 0, symbolPosition: 'before' },
  { code: 'PLN', symbol: 'zł ',   name: 'Polish Złoty',      flag: '🇵🇱', roundTo: 1,    decimals: 0, symbolPosition: 'before' },
  { code: 'JPY', symbol: '¥',     name: 'Japanese Yen',      flag: '🇯🇵', roundTo: 100,  decimals: 0, symbolPosition: 'before' },
  { code: 'CNY', symbol: '¥',     name: 'Chinese Yuan',      flag: '🇨🇳', roundTo: 1,    decimals: 0, symbolPosition: 'before' },
  { code: 'HKD', symbol: 'HK$',   name: 'Hong Kong Dollar',  flag: '🇭🇰', roundTo: 1,    decimals: 0, symbolPosition: 'before' },
  { code: 'SGD', symbol: 'S$',    name: 'Singapore Dollar',  flag: '🇸🇬', roundTo: 1,    decimals: 2, symbolPosition: 'before' },
  { code: 'TWD', symbol: 'NT$',   name: 'Taiwan Dollar',     flag: '🇹🇼', roundTo: 10,   decimals: 0, symbolPosition: 'before' },
  { code: 'KRW', symbol: '₩',     name: 'South Korean Won',  flag: '🇰🇷', roundTo: 100,  decimals: 0, symbolPosition: 'before' },
  { code: 'INR', symbol: '₹',     name: 'Indian Rupee',      flag: '🇮🇳', roundTo: 10,   decimals: 0, symbolPosition: 'before' },
  { code: 'PHP', symbol: '₱',     name: 'Philippine Peso',   flag: '🇵🇭', roundTo: 10,   decimals: 0, symbolPosition: 'before' },
  { code: 'MYR', symbol: 'RM ',   name: 'Malaysian Ringgit', flag: '🇲🇾', roundTo: 1,    decimals: 0, symbolPosition: 'before' },
  { code: 'THB', symbol: '฿',     name: 'Thai Baht',         flag: '🇹🇭', roundTo: 10,   decimals: 0, symbolPosition: 'before' },
  { code: 'IDR', symbol: 'Rp ',   name: 'Indonesian Rupiah', flag: '🇮🇩', roundTo: 1000, decimals: 0, symbolPosition: 'before' },
  { code: 'VND', symbol: '₫ ',    name: 'Vietnamese Dong',   flag: '🇻🇳', roundTo: 1000, decimals: 0, symbolPosition: 'after'  },
  { code: 'BDT', symbol: '৳',     name: 'Bangladeshi Taka',  flag: '🇧🇩', roundTo: 10,   decimals: 0, symbolPosition: 'before' },
  { code: 'PKR', symbol: '₨ ',    name: 'Pakistani Rupee',   flag: '🇵🇰', roundTo: 50,   decimals: 0, symbolPosition: 'before' },
  { code: 'AED', symbol: 'AED ',  name: 'UAE Dirham',        flag: '🇦🇪', roundTo: 1,    decimals: 0, symbolPosition: 'before' },
  { code: 'SAR', symbol: 'SAR ',  name: 'Saudi Riyal',       flag: '🇸🇦', roundTo: 1,    decimals: 0, symbolPosition: 'before' },
  { code: 'ILS', symbol: '₪',     name: 'Israeli Shekel',    flag: '🇮🇱', roundTo: 1,    decimals: 0, symbolPosition: 'before' },
  { code: 'EGP', symbol: 'E£ ',   name: 'Egyptian Pound',    flag: '🇪🇬', roundTo: 5,    decimals: 0, symbolPosition: 'before' },
  { code: 'TRY', symbol: '₺',     name: 'Turkish Lira',      flag: '🇹🇷', roundTo: 10,   decimals: 0, symbolPosition: 'before' },
  { code: 'MXN', symbol: 'MX$',   name: 'Mexican Peso',      flag: '🇲🇽', roundTo: 10,   decimals: 0, symbolPosition: 'before' },
  { code: 'BRL', symbol: 'R$',    name: 'Brazilian Real',    flag: '🇧🇷', roundTo: 1,    decimals: 0, symbolPosition: 'before' },
  { code: 'ARS', symbol: 'AR$',   name: 'Argentine Peso',    flag: '🇦🇷', roundTo: 1000, decimals: 0, symbolPosition: 'before' },
  { code: 'COP', symbol: 'CO$',   name: 'Colombian Peso',    flag: '🇨🇴', roundTo: 1000, decimals: 0, symbolPosition: 'before' },
  { code: 'CLP', symbol: 'CL$',   name: 'Chilean Peso',      flag: '🇨🇱', roundTo: 500,  decimals: 0, symbolPosition: 'before' },
  { code: 'ZAR', symbol: 'R',     name: 'South African Rand',flag: '🇿🇦', roundTo: 10,   decimals: 0, symbolPosition: 'before' },
  { code: 'NGN', symbol: '₦',     name: 'Nigerian Naira',    flag: '🇳🇬', roundTo: 100,  decimals: 0, symbolPosition: 'before' },
  { code: 'KES', symbol: 'KSh ',  name: 'Kenyan Shilling',   flag: '🇰🇪', roundTo: 50,   decimals: 0, symbolPosition: 'before' },
  { code: 'GHS', symbol: 'GH₵ ',  name: 'Ghanaian Cedi',     flag: '🇬🇭', roundTo: 1,    decimals: 0, symbolPosition: 'before' },
];

const CURRENCY_BY_CODE: Record<string, CurrencyDef> =
  Object.fromEntries(SUPPORTED_CURRENCIES.map(c => [c.code, c]));

export function getCurrencyDef(code: string | undefined | null): CurrencyDef {
  if (!code) return CURRENCY_BY_CODE.USD;
  return CURRENCY_BY_CODE[code] ?? CURRENCY_BY_CODE.USD;
}

// ----------------------------------------------------------------------
// Country → currency
// ----------------------------------------------------------------------

/**
 * ISO-3166 alpha-2 country code → currency code we display for that
 * country. Limited to currencies in SUPPORTED_CURRENCIES — anything
 * else falls back to USD on the calling side.
 *
 * We only include countries where the local currency is on our
 * supported list. For example Norway → NOK is mapped, but Iceland
 * (ISK) is intentionally not — we'd show USD there until we add ISK.
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // North America
  US: 'USD', CA: 'CAD', MX: 'MXN',
  // Europe (eurozone)
  AT: 'EUR', BE: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR', ES: 'EUR',
  FI: 'EUR', FR: 'EUR', GR: 'EUR', IE: 'EUR', IT: 'EUR', LT: 'EUR',
  LU: 'EUR', LV: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR', SI: 'EUR',
  SK: 'EUR', HR: 'EUR',
  // Other Europe
  GB: 'GBP', IM: 'GBP', JE: 'GBP', GG: 'GBP',
  CH: 'CHF', LI: 'CHF',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN',
  // Asia-Pacific
  AU: 'AUD', NZ: 'NZD',
  JP: 'JPY', CN: 'CNY', HK: 'HKD', MO: 'HKD',
  SG: 'SGD', TW: 'TWD', KR: 'KRW',
  IN: 'INR', PH: 'PHP', MY: 'MYR', TH: 'THB', ID: 'IDR',
  VN: 'VND', BD: 'BDT', PK: 'PKR', LK: 'INR' /* approx */, NP: 'INR' /* approx */,
  // Middle East & North Africa
  AE: 'AED', SA: 'SAR', QA: 'AED' /* approx */, BH: 'AED' /* approx */,
  KW: 'AED' /* approx */, OM: 'AED' /* approx */,
  IL: 'ILS', PS: 'ILS',
  EG: 'EGP', TR: 'TRY',
  // Latin America
  BR: 'BRL', AR: 'ARS', CO: 'COP', CL: 'CLP',
  PE: 'USD' /* unsupported, fallback */,
  // Sub-Saharan Africa
  ZA: 'ZAR', NG: 'NGN', KE: 'KES', GH: 'GHS',
};

export function currencyForCountry(country: string | undefined | null): string {
  if (!country) return 'USD';
  return COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? 'USD';
}

// ----------------------------------------------------------------------
// Conversion + rounding
// ----------------------------------------------------------------------

interface FxJson {
  base: 'USD';
  fetchedAt: string;
  upstreamUpdatedAt: string | null;
  source: string;
  rates: Record<string, number>;
}

const RATES: FxJson = fxRates as FxJson;

export function getFxMeta() {
  return {
    fetchedAt: RATES.fetchedAt,
    source: RATES.source,
  };
}

/**
 * Round a raw FX-converted number to a "psychologically clean" amount.
 * Goal: prices feel intentional, not algorithmic.
 *
 * Strategy:
 *   1. Round to the nearest `roundTo` step (e.g. 10 for PHP, 100 for
 *      JPY, 1 for USD).
 *   2. If the resulting price ends in 0 and is >= 100, subtract 1 so
 *      it ends in 9. e.g. 3000 → 2999, 50 → 49.
 *   3. Skip step 2 for currencies where the smallest visible unit is
 *      so large that ending-in-9 looks weird (e.g. JPY ¥4900 stays at
 *      ¥4900, not ¥4899).
 */
function roundPsychologically(amount: number, def: CurrencyDef): number {
  const step = def.roundTo;
  const rounded = Math.round(amount / step) * step;
  if (rounded < 100) {
    // Tiny prices — no -1 trick (would look weird as 4 instead of 5)
    return rounded;
  }
  // For currencies that already round in 10s/100s/etc, stay tidy
  if (step >= 50) return rounded;
  // Subtract 1 so the displayed price ends in 9
  return rounded - 1;
}

/**
 * Convert a USD amount to the target currency, applying psychological
 * rounding. If the target currency has no rate (network failure case),
 * we return the USD amount unchanged so the caller can detect failure
 * via getCurrencyDef('USD').
 */
export function convertUsdToLocal(
  usd: number,
  currencyCode: string,
): { amount: number; currency: CurrencyDef; converted: boolean } {
  const def = getCurrencyDef(currencyCode);
  if (def.code === 'USD') {
    return { amount: usd, currency: def, converted: false };
  }
  const rate = RATES.rates[def.code];
  if (typeof rate !== 'number' || rate <= 0) {
    return { amount: usd, currency: getCurrencyDef('USD'), converted: false };
  }
  const raw = usd * rate;
  const rounded = roundPsychologically(raw, def);
  return { amount: rounded, currency: def, converted: true };
}

// ----------------------------------------------------------------------
// Formatting
// ----------------------------------------------------------------------

/**
 * Format a number in the given currency using Intl.NumberFormat. We
 * pick a sensible locale per currency so thousands separators look
 * native (e.g. PHP uses '1,000' but EUR-DE uses '1.000').
 */
const LOCALE_FOR_CURRENCY: Record<string, string> = {
  USD: 'en-US', GBP: 'en-GB', EUR: 'en-IE', CHF: 'de-CH',
  SEK: 'sv-SE', NOK: 'nb-NO', DKK: 'da-DK', PLN: 'pl-PL',
  CAD: 'en-CA', AUD: 'en-AU', NZD: 'en-NZ',
  JPY: 'ja-JP', CNY: 'zh-CN', HKD: 'zh-HK', SGD: 'en-SG', TWD: 'zh-TW', KRW: 'ko-KR',
  INR: 'en-IN', PHP: 'en-PH', MYR: 'ms-MY', THB: 'th-TH', IDR: 'id-ID', VND: 'vi-VN',
  BDT: 'bn-BD', PKR: 'en-PK', AED: 'en-AE', SAR: 'ar-SA', ILS: 'he-IL',
  EGP: 'ar-EG', TRY: 'tr-TR',
  MXN: 'es-MX', BRL: 'pt-BR', ARS: 'es-AR', COP: 'es-CO', CLP: 'es-CL',
  ZAR: 'en-ZA', NGN: 'en-NG', KES: 'en-KE', GHS: 'en-GH',
};

export function formatCurrency(amount: number, currencyCode: string): string {
  const def = getCurrencyDef(currencyCode);
  const locale = LOCALE_FOR_CURRENCY[def.code] ?? 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: def.code,
      minimumFractionDigits: def.decimals,
      maximumFractionDigits: def.decimals,
    }).format(amount);
  } catch {
    // Defensive fallback (very old runtimes)
    const rounded = def.decimals === 0 ? Math.round(amount) : Math.round(amount * 100) / 100;
    const num = rounded.toLocaleString('en-US', {
      minimumFractionDigits: def.decimals,
      maximumFractionDigits: def.decimals,
    });
    return def.symbolPosition === 'after' ? `${num} ${def.symbol.trim()}` : `${def.symbol}${num}`;
  }
}
