/**
 * Multi-Currency and Country-Aware Currency Formatter
 * Supports USD ($), INR (₹), GBP (£), EUR (€), AUD (A$), CAD (C$), JPY (¥), SGD (S$)
 */

const localeMap: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'de-DE',
  AUD: 'en-AU',
  CAD: 'en-CA',
  JPY: 'ja-JP',
  SGD: 'en-SG',
};

const symbolMap: Record<string, string> = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  EUR: '€',
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥',
  SGD: 'S$',
};

export function formatCurrency(
  val: number | string | null | undefined,
  currency: string = 'USD',
  country?: string,
  options: { decimals?: boolean; compact?: boolean } = {}
): string {
  const { decimals = true, compact = false } = options;
  const num = typeof val === 'string' ? parseFloat(val) : Number(val || 0);

  const currencyCode = (currency || (country === 'India' ? 'INR' : 'USD')).toUpperCase().trim();
  const sym = symbolMap[currencyCode] || `${currencyCode} `;

  if (isNaN(num)) {
    return `${sym}0.00`;
  }

  if (compact) {
    if (currencyCode === 'INR') {
      if (Math.abs(num) >= 10000000) return `${sym}${(num / 10000000).toFixed(2)} Cr`;
      if (Math.abs(num) >= 100000) return `${sym}${(num / 100000).toFixed(2)} L`;
      if (Math.abs(num) >= 1000) return `${sym}${(num / 1000).toFixed(1)}k`;
    } else {
      if (Math.abs(num) >= 1000000000) return `${sym}${(num / 1000000000).toFixed(2)}B`;
      if (Math.abs(num) >= 1000000) return `${sym}${(num / 1000000).toFixed(2)}M`;
      if (Math.abs(num) >= 1000) return `${sym}${(num / 1000).toFixed(1)}k`;
    }
  }

  const locale = localeMap[currencyCode] || 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'JPY' ? 0 : (decimals ? 2 : 0),
      maximumFractionDigits: currencyCode === 'JPY' ? 0 : (decimals ? 2 : 0),
    }).format(num);
  } catch {
    return `${sym}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Backward-compatible helper for INR formatting
 */
export function formatINR(
  val: number | string | null | undefined,
  options: { decimals?: boolean; compact?: boolean } = {}
): string {
  return formatCurrency(val, 'INR', 'India', options);
}
