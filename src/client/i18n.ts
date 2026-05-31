import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from '@/messages/en.json'
import id from '@/messages/id.json'

const getCookieLocale = () => {
  const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/)
  return match?.[1]
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      id: { translation: id },
      en: { translation: en },
    },
    lng: getCookieLocale() || 'id',
    fallbackLng: 'id',
    interpolation: { escapeValue: false },
    detection: {
      order: ['cookie', 'path', 'navigator'],
      caches: ['cookie'],
      lookupCookie: 'NEXT_LOCALE',
    },
  })

export default i18n
