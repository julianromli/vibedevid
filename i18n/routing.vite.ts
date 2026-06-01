export const routing = {
  locales: ['id', 'en'] as const,
  defaultLocale: 'id' as const,
}

export type Locale = (typeof routing.locales)[number]
