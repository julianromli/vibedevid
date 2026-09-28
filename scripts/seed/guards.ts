import { normalizeHostname } from '@/lib/seo/site-url'

export const PRODUCTION_SITE_HOSTS = ['vibedeveloper.id', 'vibedevid.com'] as const

export function isProductionSiteUrl(url: string | undefined): boolean {
  if (!url) return false

  try {
    const host = normalizeHostname(new URL(url).hostname)
    return PRODUCTION_SITE_HOSTS.some(
      (productionHost) => host === productionHost || host.endsWith(`.${productionHost}`),
    )
  } catch {
    return PRODUCTION_SITE_HOSTS.some((productionHost) => url.toLowerCase().includes(productionHost))
  }
}

export function assertSafeSeedTarget(input: { siteUrls: Array<string | undefined>; allowProduction: boolean }): void {
  if (input.allowProduction) return

  const blocked = input.siteUrls.find(isProductionSiteUrl)
  if (!blocked) return

  throw new Error(
    `Refusing to seed a production site URL (${blocked}). Use a local Neon project, or set SEED_ALLOW_PRODUCTION=1 only if you intend to write demo rows to production.`,
  )
}

export function requestUrlIsProduction(requestUrl: string): boolean {
  return isProductionSiteUrl(requestUrl)
}

/**
 * Demo seed must not run against a database that already has real accounts.
 * Production tripped this: the site-URL check passed, then `db:seed` inserted
 * Sarah Chen / Marcus Rodriguez projects onto the live homepage.
 */
export function assertNoRealUsersBeforeSeed(input: { realUserCount: number; allowProduction: boolean }): void {
  if (input.allowProduction || input.realUserCount === 0) return

  throw new Error(
    `Refusing to seed a database that already has ${input.realUserCount} non-seed user(s). Use an empty local Neon project. Set SEED_ALLOW_PRODUCTION=1 only for a disposable database.`,
  )
}
