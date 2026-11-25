import type { LocaleCode } from "./locales";

/**
 * Shell strings that are rendered by the layout and shared controls.
 *
 * Deep page content is intentionally not translated yet; this dictionary is
 * the single place new keys should be added as pages are localised.
 */
const en = {
  "nav.home": "Home",
  "nav.interests": "Interests",
  "nav.listings": "Listings",
  "nav.messages": "Messages",
  "nav.applications": "Applications",
  "nav.approvals": "Approvals",
  "footer.rights": "All rights reserved! Petad 2026",
  "footer.scrollToTop": "Scroll to top",
  "language.label": "Language",
  "range.from": "From",
  "range.to": "To",
  "time.today": "Today",
  "time.yesterday": "Yesterday",
} as const;

export type TranslationKey = keyof typeof en;

export const translations: Record<LocaleCode, Record<TranslationKey, string>> = {
  "en-GB": en,
  "fr-FR": {
    "nav.home": "Accueil",
    "nav.interests": "Centres d'intérêt",
    "nav.listings": "Annonces",
    "nav.messages": "Messages",
    "nav.applications": "Candidatures",
    "nav.approvals": "Approbations",
    "footer.rights": "Tous droits réservés ! Petad 2026",
    "footer.scrollToTop": "Haut de la page",
    "language.label": "Langue",
    "range.from": "Du",
    "range.to": "Au",
    "time.today": "Aujourd'hui",
    "time.yesterday": "Hier",
  },
  "es-ES": {
    "nav.home": "Inicio",
    "nav.interests": "Intereses",
    "nav.listings": "Anuncios",
    "nav.messages": "Mensajes",
    "nav.applications": "Solicitudes",
    "nav.approvals": "Aprobaciones",
    "footer.rights": "¡Todos los derechos reservados! Petad 2026",
    "footer.scrollToTop": "Volver arriba",
    "language.label": "Idioma",
    "range.from": "Desde",
    "range.to": "Hasta",
    "time.today": "Hoy",
    "time.yesterday": "Ayer",
  },
  "pt-BR": {
    "nav.home": "Início",
    "nav.interests": "Interesses",
    "nav.listings": "Anúncios",
    "nav.messages": "Mensagens",
    "nav.applications": "Candidaturas",
    "nav.approvals": "Aprovações",
    "footer.rights": "Todos os direitos reservados! Petad 2026",
    "footer.scrollToTop": "Voltar ao topo",
    "language.label": "Idioma",
    "range.from": "De",
    "range.to": "Até",
    "time.today": "Hoje",
    "time.yesterday": "Ontem",
  },
  "ar-EG": {
    "nav.home": "الرئيسية",
    "nav.interests": "الاهتمامات",
    "nav.listings": "الإعلانات",
    "nav.messages": "الرسائل",
    "nav.applications": "الطلبات",
    "nav.approvals": "الموافقات",
    "footer.rights": "جميع الحقوق محفوظة! بيتاد 2026",
    "footer.scrollToTop": "العودة إلى الأعلى",
    "language.label": "اللغة",
    "range.from": "من",
    "range.to": "إلى",
    "time.today": "اليوم",
    "time.yesterday": "أمس",
  },
};

export function translate(locale: LocaleCode, key: TranslationKey): string {
  return translations[locale]?.[key] ?? translations["en-GB"][key];
}
