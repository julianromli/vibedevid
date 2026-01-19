import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['id', 'en'],
  defaultLocale: 'id',
  localePrefix: 'as-needed', // Only show /en for English, Indonesian at root
})

export type Locale = (typeof routing.locales)[number]
