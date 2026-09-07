export const PRODUCTION_SITE_HOSTS = ['vibedeveloper.id', 'vibedevid.com'] as const

export function isProductionSiteUrl(url: string | undefined): boolean {
  if (!url) return false

  try {
    const host = new URL(url).hostname.toLowerCase()
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
