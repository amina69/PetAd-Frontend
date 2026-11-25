import i18n, { type BackendModule } from "i18next";
import { initReactI18next } from "react-i18next";

type CommonResources = typeof import("./locales/en/common.json");

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: CommonResources;
    };
  }
}

const localeLoaders = import.meta.glob<CommonResources>(
  "./locales/*/*.json",
  { import: "default" },
);

const backend: BackendModule = {
  type: "backend",
  init() {},
  read(language, namespace, callback) {
    const loadLocale = localeLoaders[`./locales/${language}/${namespace}.json`];
    if (!loadLocale) {
      callback(new Error(`Unknown locale: ${language}`), null);
      return;
    }

    void loadLocale()
      .then((resources) => callback(null, resources))
      .catch((error: unknown) =>
        callback(error instanceof Error ? error : new Error(String(error)), null),
      );
  },
};

void i18n
  .use(backend)
  .use(initReactI18next)
  .init({
    lng: "en",
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common"],
    interpolation: { escapeValue: false },
  })
  .then(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? "en";
  });

i18n.on("languageChanged", (language) => {
  document.documentElement.lang = language;
});

export default i18n;
