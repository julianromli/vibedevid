import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "../messages/en.json";
import id from "../messages/id.json";

const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];

export const routing = {
  locales,
  defaultLocale: "id" as Locale,
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
      supportedLngs: [...locales],
      detection: {
        order: ["cookie", "navigator"],
        caches: ["cookie"],
        lookupCookie: "NEXT_LOCALE",
      },
      interpolation: {
        escapeValue: false,
      },
      returnObjects: true,
    });
}

export default i18n;
