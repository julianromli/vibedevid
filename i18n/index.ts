import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../messages/en.json";
import id from "../messages/id.json";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/locale";

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

function initI18n() {
  return i18n.use(initReactI18next).init({
    lng: DEFAULT_LOCALE,
    resources: {
      id: buildLocaleResources(id),
      en: buildLocaleResources(en),
    },
    fallbackLng: routing.defaultLocale,
    supportedLngs: [...LOCALES],
    interpolation: {
      escapeValue: false,
    },
    returnObjects: true,
    react: {
      useSuspense: false,
    },
  });
}

export const i18nInit: Promise<unknown> = i18n.isInitialized ? Promise.resolve() : initI18n();

export default i18n;
