const BOT_PATTERN =
  /bot|crawler|spider|scraper|googlebot|bingbot|slurp|duckduckbot|facebookexternalhit|twitterbot|whatsapp/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return BOT_PATTERN.test(userAgent);
}
