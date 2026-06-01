import en from '@/messages/en.json'
import id from '@/messages/id.json'

export type SeoLocale = 'id' | 'en'

type MetadataMessages = (typeof id)['metadata']

const catalogs: Record<SeoLocale, MetadataMessages> = {
  id: id.metadata,
  en: en.metadata,
}

export function getMetadataMessages(locale: SeoLocale): MetadataMessages {
  return catalogs[locale] ?? catalogs.id
}

export function formatTitle(template: string, pageTitle: string): string {
  return template.replace('%s', () => pageTitle)
}
