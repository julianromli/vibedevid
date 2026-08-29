import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../messages/en.json";
import id from "../messages/id.json";
import { DEFAULT_LOCALE, getBrowserInitialLocale, isLocale, LOCALES } from "@/lib/locale";

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
    lng: getBrowserInitialLocale(),
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

/**
 * Apply a locale to the shared i18n instance. Bundled resources make
 * `changeLanguage` finish before this returns, so RootLayout can call it
 * during render and `useTranslation` in the same pass sees the SSR language
 * even when TanStack skips client `beforeLoad` on a dehydrated match.
 */
export function syncI18nLocale(locale: string): void {
  if (!isLocale(locale) || i18n.language === locale) {
    return;
  }
  void i18n.changeLanguage(locale);
}

export default i18n;
