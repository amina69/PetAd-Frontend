import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { languagePreferenceService } from "../api/preferencesService";
import {
  DEFAULT_LOCALE,
  LOCALES,
  detectInitialLocale,
  getTextDirection,
  normalizeLocale,
  writeStoredLocale,
  type LocaleCode,
  type TextDirection,
} from "./locales";
import { translate, type TranslationKey } from "./translations";

export interface LocaleContextValue {
  /** Active BCP-47 locale, e.g. `fr-FR`. */
  locale: LocaleCode;
  /** Text direction for the active locale (`rtl` for Arabic). */
  dir: TextDirection;
  /** Every locale the app ships, each labelled in its own language. */
  languages: typeof LOCALES;
  /** Switches locale immediately and persists it locally + to the profile. */
  setLocale: (locale: LocaleCode) => void;
  /** Looks up a shell translation for the active locale. */
  t: (key: TranslationKey) => string;
}

const fallbackContext: LocaleContextValue = {
  locale: DEFAULT_LOCALE,
  dir: getTextDirection(DEFAULT_LOCALE),
  languages: LOCALES,
  setLocale: () => {
    // No provider mounted (e.g. an isolated component in a test): switching is
    // a no-op rather than a crash.
  },
  t: (key) => translate(DEFAULT_LOCALE, key),
};

const LocaleContext = createContext<LocaleContextValue>(fallbackContext);

function hasAuthToken(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return Boolean(
      window.localStorage.getItem("auth_token") ??
        window.sessionStorage.getItem("auth_token"),
    );
  } catch {
    return false;
  }
}

interface LanguageProviderProps {
  children: ReactNode;
  /** Test/SSR escape hatch; normally detection runs automatically. */
  initialLocale?: LocaleCode;
}

export function LanguageProvider({
  children,
  initialLocale,
}: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<LocaleCode>(
    () => initialLocale ?? detectInitialLocale(),
  );
  const userSelectedRef = useRef(false);
  const dir = getTextDirection(locale);

  // Keep the document in sync so native controls, screen readers and the
  // browser's own UI pick up the chosen language/direction.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  // Signed-in users get their choice from the profile so it follows them to a
  // new device. A failure simply leaves the local/browser choice in place.
  useEffect(() => {
    if (!hasAuthToken()) return;

    let cancelled = false;

    void languagePreferenceService.getLanguage().then((remote) => {
      const next = normalizeLocale(remote);
      if (cancelled || !next || userSelectedRef.current) return;

      setLocaleState(next);
      writeStoredLocale(next);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((next: LocaleCode) => {
    const resolved = normalizeLocale(next);
    if (!resolved) return;

    userSelectedRef.current = true;
    setLocaleState(resolved);
    writeStoredLocale(resolved);

    if (hasAuthToken()) {
      void languagePreferenceService.setLanguage(resolved);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translate(locale, key),
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, dir, languages: LOCALES, setLocale, t }),
    [locale, dir, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/**
 * Access the active locale. Components rendered outside a provider get the
 * default locale instead of throwing, which keeps isolated tests and story
 * previews working.
 */
export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
