/**
 * Currency utilities for the whole application.
 *
 * Myncel is used internationally — never hardcode "$" or "USD".
 * Always use these helpers so the org's chosen currency drives every display.
 */

export interface CurrencyOption {
  code: string; // ISO 4217 (e.g. "USD")
  name: string; // Human-readable (e.g. "US Dollar")
  symbol: string; // Display symbol (e.g. "$", "€", "₦")
}

/**
 * Curated list of the most-used currencies worldwide.
 * Order: most common first, then alphabetical by name.
 * Add more here as needed — the schema accepts any valid ISO 4217 string.
 */
export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar',         symbol: '$'   },
  { code: 'EUR', name: 'Euro',              symbol: '€'   },
  { code: 'GBP', name: 'British Pound',     symbol: '£'   },
  { code: 'CAD', name: 'Canadian Dollar',   symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$'  },
  { code: 'JPY', name: 'Japanese Yen',      symbol: '¥'   },
  { code: 'CNY', name: 'Chinese Yuan',      symbol: '¥'   },
  { code: 'INR', name: 'Indian Rupee',      symbol: '₹'   },
  { code: 'NGN', name: 'Nigerian Naira',    symbol: '₦'   },
  { code: 'ZAR', name: 'South African Rand',symbol: 'R'   },
  { code: 'BRL', name: 'Brazilian Real',    symbol: 'R$'  },
  { code: 'MXN', name: 'Mexican Peso',      symbol: 'Mex$'},
  { code: 'CHF', name: 'Swiss Franc',       symbol: 'CHF' },
  { code: 'SEK', name: 'Swedish Krona',     symbol: 'kr'  },
  { code: 'NOK', name: 'Norwegian Krone',   symbol: 'kr'  },
  { code: 'DKK', name: 'Danish Krone',      symbol: 'kr'  },
  { code: 'PLN', name: 'Polish Zloty',      symbol: 'zł'  },
  { code: 'CZK', name: 'Czech Koruna',      symbol: 'Kč'  },
  { code: 'HUF', name: 'Hungarian Forint',  symbol: 'Ft'  },
  { code: 'TRY', name: 'Turkish Lira',      symbol: '₺'   },
  { code: 'ILS', name: 'Israeli Shekel',    symbol: '₪'   },
  { code: 'AED', name: 'UAE Dirham',        symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal',       symbol: '﷼'   },
  { code: 'EGP', name: 'Egyptian Pound',    symbol: 'E£'  },
  { code: 'KES', name: 'Kenyan Shilling',   symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi',     symbol: 'GH₵' },
  { code: 'PHP', name: 'Philippine Peso',   symbol: '₱'   },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp'  },
  { code: 'THB', name: 'Thai Baht',         symbol: '฿'   },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM'  },
  { code: 'SGD', name: 'Singapore Dollar',  symbol: 'S$'  },
  { code: 'HKD', name: 'Hong Kong Dollar',  symbol: 'HK$' },
  { code: 'KRW', name: 'South Korean Won',  symbol: '₩'   },
  { code: 'NZD', name: 'New Zealand Dollar',symbol: 'NZ$' },
  { code: 'RUB', name: 'Russian Ruble',     symbol: '₽'   },
  { code: 'ARS', name: 'Argentine Peso',    symbol: 'AR$' },
  { code: 'CLP', name: 'Chilean Peso',      symbol: 'CLP$'},
  { code: 'COP', name: 'Colombian Peso',    symbol: 'COL$'},
  { code: 'PEN', name: 'Peruvian Sol',      symbol: 'S/.' },
  { code: 'PKR', name: 'Pakistani Rupee',   symbol: '₨'   },
  { code: 'BDT', name: 'Bangladeshi Taka',  symbol: '৳'   },
  { code: 'VND', name: 'Vietnamese Dong',   symbol: '₫'   },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴'   },
  { code: 'RON', name: 'Romanian Leu',      symbol: 'lei' },
  { code: 'BGN', name: 'Bulgarian Lev',     symbol: 'лв'  },
  { code: 'HRK', name: 'Croatian Kuna',     symbol: 'kn'  },
  { code: 'ISK', name: 'Icelandic Krona',   symbol: 'kr'  },
];

const CURRENCY_BY_CODE: Record<string, CurrencyOption> = SUPPORTED_CURRENCIES.reduce(
  (acc, c) => ({ ...acc, [c.code]: c }),
  {} as Record<string, CurrencyOption>,
);

/**
 * Validate a currency code. Returns "USD" if invalid.
 */
export function normalizeCurrencyCode(code: string | null | undefined): string {
  if (!code) return 'USD';
  const upper = code.toUpperCase();
  return CURRENCY_BY_CODE[upper] ? upper : 'USD';
}

/**
 * Get the symbol for a currency code (e.g. "$", "€", "₦").
 * Falls back to the code itself if unknown.
 */
export function getCurrencySymbol(code: string | null | undefined): string {
  const normalized = normalizeCurrencyCode(code);
  return CURRENCY_BY_CODE[normalized]?.symbol ?? normalized;
}

/**
 * Format a number as a currency string using Intl.NumberFormat.
 * Falls back to a manual "{symbol}{amount}" string if the runtime
 * doesn't support the currency code.
 *
 * @example
 *   formatCurrency(1234.5, 'USD') // "$1,234.50"
 *   formatCurrency(1234.5, 'EUR') // "€1,234.50"
 *   formatCurrency(1234.5, 'NGN') // "₦1,234.50"
 *   formatCurrency(null, 'EUR')   // "—"
 */
export function formatCurrency(
  amount: number | null | undefined,
  currencyCode: string | null | undefined,
  opts: { fallback?: string; minimumFractionDigits?: number; maximumFractionDigits?: number } = {},
): string {
  const fallback = opts.fallback ?? '—';
  if (amount === null || amount === undefined || Number.isNaN(amount)) return fallback;

  const code = normalizeCurrencyCode(currencyCode);
  const minFrac = opts.minimumFractionDigits ?? 2;
  const maxFrac = opts.maximumFractionDigits ?? 2;

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: minFrac,
      maximumFractionDigits: maxFrac,
    }).format(amount);
  } catch {
    // Fallback for runtimes that don't recognize the code
    const symbol = getCurrencySymbol(code);
    const formatted = amount.toLocaleString(undefined, {
      minimumFractionDigits: minFrac,
      maximumFractionDigits: maxFrac,
    });
    return `${symbol}${formatted}`;
  }
}

/**
 * Convenience: format a number with no decimals (good for big totals on dashboard cards).
 */
export function formatCurrencyShort(
  amount: number | null | undefined,
  currencyCode: string | null | undefined,
): string {
  return formatCurrency(amount, currencyCode, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
