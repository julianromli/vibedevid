import { getCookie } from '@tanstack/react-start/server'
import i18n from '@/i18n'
import type { Locale } from '@/i18n'
import type { SortBy } from '@/types/homepage'

export function getSingleSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function normalizeSortParam(value: string | undefined): SortBy {
  return value === 'top' || value === 'newest' || value === 'trending' ? value : 'trending'
}

export function getServerLocale(): Locale {
  const cookie = getCookie('NEXT_LOCALE')
  return cookie === 'en' ? 'en' : 'id'
}

export function getServerT(namespace: string) {
  return i18n.getFixedT(getServerLocale(), namespace)
}
