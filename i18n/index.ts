import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "../messages/en.json";
import id from "../messages/id.json";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, LOCALES } from "@/lib/locale";

export type Locale = (typeof LOCALES)[number];

export const routing = {
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
};

function buildLocaleResources(localeData: typeof en) {
  const namespaces: Record<string, object> = { translation: localeData };
  for (const [key, value] of Object.entries(localeData)) {
    if (value && typeof value === "object") {
      namespaces[key] = value as object;
    }
  }
  return namespaces;
}

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        id: buildLocaleResources(id),
        en: buildLocaleResources(en),
      },
      fallbackLng: routing.defaultLocale,
      supportedLngs: [...LOCALES],
      detection: {
        order: ["cookie", "navigator"],
        caches: ["cookie"],
        lookupCookie: LOCALE_COOKIE_NAME,
      },
      interpolation: {
        escapeValue: false,
      },
      returnObjects: true,
    });
}

export default i18n;
