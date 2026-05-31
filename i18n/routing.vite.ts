export const routing = {
  locales: ['id', 'en'] as const,
  defaultLocale: 'id' as const,
  localePrefix: 'as-needed' as const,
}

export type Locale = (typeof routing.locales)[number]
