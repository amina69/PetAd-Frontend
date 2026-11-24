export type NumberInput = number | string;

function toNumber(value: NumberInput): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Format a plain number with the active locale (grouping and decimal
 * separators). Prefer this over `Number#toLocaleString()` so the locale
 * always comes from `useLocale()` rather than the host's default.
 */
export function formatNumber(
  value: NumberInput,
  locale = "en-US",
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, options).format(toNumber(value));
}

/**
 * Format an ISO 4217 currency amount. Unknown/non-ISO codes (e.g. crypto
 * tickers the runtime does not recognise) fall back to a locale-formatted
 * number prefixed with the code instead of throwing a RangeError.
 */
export function formatCurrency(
  value: NumberInput,
  currency: string,
  locale = "en-US",
  options: Intl.NumberFormatOptions = {},
): string {
  const amount = toNumber(value);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      ...options,
    }).format(amount);
  } catch {
    return `${currency} ${formatNumber(amount, locale, options)}`;
  }
}

/**
 * Format a crypto/token amount without a currency symbol (the asset code is
 * rendered separately). Defaults match Stellar amounts: at least 2 and at
 * most 7 decimal places.
 */
export function formatAmount(
  value: NumberInput,
  locale = "en-US",
  options: Intl.NumberFormatOptions = {},
): string {
  return formatNumber(value, locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
    ...options,
  });
}

/**
 * Format a 0–1 ratio as a percentage (e.g. 0.256 → "25.6%").
 * The percentage sign/placement and decimal separator follow the locale.
 */
export function formatPercent(
  ratio: number,
  locale = "en-US",
  fractionDigits = 1,
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number.isFinite(ratio) ? ratio : 0);
}
