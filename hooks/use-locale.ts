import { useTranslation } from "react-i18next";
import type { Locale } from "@/i18n";

/** Compat hook mirroring next-intl useLocale. */
export function useLocale(): Locale {
  const { i18n } = useTranslation();
  return (i18n.language === "en" ? "en" : "id") as Locale;
}
