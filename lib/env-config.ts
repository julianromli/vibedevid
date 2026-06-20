// Environment configuration with fallbacks for build-time safety
function readPublicEnv(name: string): string {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const viteKey = `VITE_${name.replace(/^NEXT_PUBLIC_/, "")}` as keyof ImportMetaEnv;
    const viteValue = import.meta.env[viteKey];
    if (typeof viteValue === "string" && viteValue.length > 0) {
      return viteValue;
    }
  }

  return process.env[name] || "";
}

export function getSiteConfig() {
  return {
    siteUrl:
      readPublicEnv("NEXT_PUBLIC_SITE_URL") ||
      readPublicEnv("VITE_SITE_URL") ||
      "http://localhost:3000",
    authUrl:
      readPublicEnv("VITE_BETTER_AUTH_URL") ||
      readPublicEnv("BETTER_AUTH_URL") ||
      readPublicEnv("NEXT_PUBLIC_SITE_URL") ||
      "http://localhost:3000",
  };
}

/** @deprecated Use getSiteConfig() — kept for gradual migration */
export const getSupabaseConfig = getSiteConfig;

/** @deprecated No longer used after Neon migration */
export const getSupabaseServerConfig = getSiteConfig;
