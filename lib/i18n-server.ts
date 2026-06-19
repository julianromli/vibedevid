import { getCookie } from '@tanstack/react-start/server'
import en from '@/messages/en.json'
import id from '@/messages/id.json'
import type { Locale } from '@/i18n'

function getNestedValue(obj: Record<string, unknown>, keys: string[]): string | undefined {
  let current: unknown = obj
  for (const key of keys) {
    if (!current || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : undefined
}

export function getServerLocale(): Locale {
  const cookieLocale = getCookie('NEXT_LOCALE')
  if (cookieLocale === 'en' || cookieLocale === 'id') {
    return cookieLocale
  }
  return 'id'
}

export async function getLocale(): Promise<Locale> {
  return getServerLocale()
}

type TranslationFn = (key: string, values?: Record<string, string | number>) => string

export async function getTranslations(
  namespaceOrOptions: string | { locale: Locale; namespace: string },
): Promise<TranslationFn> {
  const locale = typeof namespaceOrOptions === 'string' ? getServerLocale() : namespaceOrOptions.locale
  const namespace =
    typeof namespaceOrOptions === 'string' ? namespaceOrOptions : namespaceOrOptions.namespace
  const messages = (locale === 'en' ? en : id) as Record<string, unknown>
  const namespaceMessages = messages[namespace]

  return (key: string, values?: Record<string, string | number>) => {
    const raw =
      namespaceMessages && typeof namespaceMessages === 'object'
        ? getNestedValue(namespaceMessages as Record<string, unknown>, key.split('.'))
        : getNestedValue(messages, `${namespace}.${key}`.split('.'))

    if (!raw) {
      return `${namespace}.${key}`
    }

    if (!values) {
      return raw
    }

    return Object.entries(values).reduce(
      (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
      raw,
    )
  }
}
