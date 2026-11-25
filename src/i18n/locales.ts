/**
 * Locale metadata for the app.
 *
 * Locales are listed by their own name ("endonym") because that is what a user
 * who cannot read the current UI language can recognise. The tags are full
 * BCP-47 locales so `Intl.*` picks up regional rules (week start, currency
 * placement, date order) rather than only the language.
 */
export const LOCALES = [
  { code: "en-GB", name: "English", dir: "ltr" },
  { code: "fr-FR", name: "Français", dir: "ltr" },
  { code: "es-ES", name: "Español", dir: "ltr" },
  { code: "pt-BR", name: "Português", dir: "ltr" },
  { code: "ar-EG", name: "العربية", dir: "rtl" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export type TextDirection = (typeof LOCALES)[number]["dir"];

export const DEFAULT_LOCALE: LocaleCode = "en-GB";

/** `localStorage` key holding the user's explicit choice. */
export const LOCALE_STORAGE_KEY = "petad:locale";

const SUPPORTED_CODES = new Set<string>(LOCALES.map((locale) => locale.code));

const LANGUAGE_TO_LOCALE: Record<string, LocaleCode> = {
  en: "en-GB",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-BR",
  ar: "ar-EG",
};

/**
 * Resolves a browser/profile value such as `en-US`, `fr` or `pt-BR` to one of
 * the locales we ship. Returns `null` when the value is missing or unsupported.
 */
export function normalizeLocale(value: string | null | undefined): LocaleCode | null {
  if (!value) return null;

  const tag = value.trim().replace(/_/g, "-");
  if (!tag) return null;

  if (SUPPORTED_CODES.has(tag)) return tag as LocaleCode;

  const language = tag.split("-")[0]?.toLowerCase() ?? "";
  return LANGUAGE_TO_LOCALE[language] ?? null;
}

export function isLocaleCode(value: unknown): value is LocaleCode {
  return typeof value === "string" && SUPPORTED_CODES.has(value);
}

export function getLocaleMeta(code: LocaleCode) {
  return LOCALES.find((locale) => locale.code === code) ?? LOCALES[0];
}

export function getTextDirection(code: LocaleCode): TextDirection {
  return getLocaleMeta(code).dir;
}

/** Reads the stored choice without ever throwing (private mode, quota, …). */
export function readStoredLocale(): LocaleCode | null {
  if (typeof window === "undefined") return null;

  try {
    return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Persists the choice. Storage failures must never break language switching. */
export function writeStoredLocale(code: LocaleCode): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, code);
  } catch {
    // Storage can be unavailable (Safari private mode, quota exceeded).
  }
}

/**
 * First supported locale from `navigator.languages`, falling back to
 * `navigator.language` and finally the default locale.
 */
export function detectBrowserLocale(): LocaleCode {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;

  const candidates = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const candidate of candidates) {
    const match = normalizeLocale(candidate);
    if (match) return match;
  }

  return DEFAULT_LOCALE;
}

/** Initial locale: explicit stored choice first, then browser preference. */
export function detectInitialLocale(): LocaleCode {
  return readStoredLocale() ?? detectBrowserLocale();
}
