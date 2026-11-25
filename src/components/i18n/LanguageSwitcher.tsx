import { useId } from "react";
import { Globe } from "lucide-react";
import { isLocaleCode, useLocale } from "../../i18n";

interface LanguageSwitcherProps {
  className?: string;
  /** Hide the visible "Language" caption while keeping the accessible name. */
  hideLabel?: boolean;
}

/**
 * Locale selector.
 *
 * Every option is rendered in its own language so it is recognisable even when
 * the current UI language is unreadable to the user. Selecting an option
 * updates the app immediately (no reload) and persists the choice.
 */
export function LanguageSwitcher({
  className = "",
  hideLabel = false,
}: LanguageSwitcherProps) {
  const id = useId();
  const { locale, setLocale, languages, t } = useLocale();

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <Globe size={16} aria-hidden="true" className="text-gray-500" />
      {hideLabel ? null : (
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-500"
        >
          {t("language.label")}
        </label>
      )}
      <select
        id={id}
        aria-label={hideLabel ? t("language.label") : undefined}
        value={locale}
        onChange={(event) => {
          if (isLocaleCode(event.target.value)) {
            setLocale(event.target.value);
          }
        }}
        className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code} lang={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </div>
  );
}
