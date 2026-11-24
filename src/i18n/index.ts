export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_STORAGE_KEY,
  detectBrowserLocale,
  detectInitialLocale,
  getLocaleMeta,
  getTextDirection,
  isLocaleCode,
  normalizeLocale,
  readStoredLocale,
  writeStoredLocale,
} from "./locales";
export type { LocaleCode, TextDirection } from "./locales";
export { LanguageProvider, useLocale } from "./LanguageProvider";
export type { LocaleContextValue } from "./LanguageProvider";
export { translations, translate } from "./translations";
export type { TranslationKey } from "./translations";
