import { useTranslation } from "react-i18next";
import type { Locale } from "@/i18n";

/** Read the active locale from the shared i18n instance. */
export function useLocale(): Locale {
  const { i18n } = useTranslation();
  return (i18n.language === "en" ? "en" : "id") as Locale;
}
