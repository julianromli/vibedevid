import { useTranslation } from 'react-i18next'

type TranslationFn = ReturnType<typeof useTranslation>['t'] & {
  raw: (key: string) => unknown
}

export function useTranslations(namespace?: string): TranslationFn {
  const { t, i18n } = useTranslation()

  const namespaced = ((key: string, ...args: unknown[]) =>
    t(namespace ? `${namespace}.${key}` : key, ...(args as [Record<string, unknown>?]))) as unknown as TranslationFn

  namespaced.raw = (key: string) => i18n.t(namespace ? `${namespace}.${key}` : key, { returnObjects: true })

  return namespaced
}

export function useLocale() {
  const { i18n } = useTranslation()
  return i18n.language === 'en' ? 'en' : 'id'
}

export function NextIntlClientProvider({ children }: { children: React.ReactNode }) {
  return children
}

export { useTranslation }
