import { afterEach, describe, expect, it } from "vite-plus/test";
import i18n, { i18nInit, syncI18nLocale } from "@/i18n";
import { DEFAULT_LOCALE } from "@/lib/locale";

describe("syncI18nLocale", () => {
  afterEach(() => {
    syncI18nLocale(DEFAULT_LOCALE);
  });

  it("updates i18n.language before the next read when resources are bundled", async () => {
    await i18nInit;
    syncI18nLocale("en");
    expect(i18n.language).toBe("en");
    syncI18nLocale("id");
    expect(i18n.language).toBe("id");
  });

  it("ignores unknown locale values", async () => {
    await i18nInit;
    syncI18nLocale("id");
    syncI18nLocale("fr");
    expect(i18n.language).toBe("id");
  });
});
