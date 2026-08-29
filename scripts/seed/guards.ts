export const PRODUCTION_SITE_HOST = "vibedevid.com";

export function isProductionSiteUrl(url: string | undefined): boolean {
  if (!url) return false;

  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === PRODUCTION_SITE_HOST || host.endsWith(`.${PRODUCTION_SITE_HOST}`);
  } catch {
    return url.toLowerCase().includes(PRODUCTION_SITE_HOST);
  }
}

export function assertSafeSeedTarget(input: {
  siteUrls: Array<string | undefined>;
  allowProduction: boolean;
}): void {
  if (input.allowProduction) return;

  const blocked = input.siteUrls.find(isProductionSiteUrl);
  if (!blocked) return;

  throw new Error(
    `Refusing to seed a production site URL (${blocked}). Use a local Neon project, or set SEED_ALLOW_PRODUCTION=1 only if you intend to write demo rows to production.`,
  );
}
