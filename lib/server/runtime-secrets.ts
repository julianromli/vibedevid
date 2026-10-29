// Server-only runtime secret access.
//
// On Cloudflare Workers, environment variables/secrets are NOT reliably
// exposed via `process.env` (Nitro's shim is populated lazily and cached
// inconsistently). The Cloudflare module handler assigns the per-request
// bindings to `globalThis.__env__`, which is the portable way to read secrets
// at runtime. We fall back to `process.env` for node-server / local dev / tests.
//
// NEVER import this module from client-reachable code — it exposes secrets.

interface ServerRuntimeSecrets {
  databaseUrl: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
  resendApiKey: string;
  emailFrom: string;
  openrouterApiKey: string;
  uploadthingToken: string;
  siteUrl: string;
  /** Not secret: comma-separated exact emails allowed to sign up outside the domain list. */
  newAccountAllowedEmails: string;
  /** Not secret: host suffix of this worker's Cloudflare preview URLs, e.g. "-vibedevid.<account>.workers.dev". */
  authPreviewHostSuffix: string;
  /** Optional: raises the GitHub API rate limit for repository import. */
  githubToken: string;
}

type EnvRecord = Record<string, string | undefined>;

function readEnv(name: string): string {
  const cfEnv = (globalThis as { __env__?: EnvRecord }).__env__;
  const fromCf = cfEnv?.[name];
  if (typeof fromCf === "string" && fromCf.length > 0) {
    return fromCf;
  }

  const fromProcess = typeof process !== "undefined" ? process.env?.[name] : undefined;
  return fromProcess || "";
}

export function getServerRuntimeSecrets(): ServerRuntimeSecrets {
  return {
    databaseUrl: readEnv("DATABASE_URL"),
    betterAuthSecret: readEnv("BETTER_AUTH_SECRET"),
    betterAuthUrl: readEnv("BETTER_AUTH_URL") || readEnv("NEXT_PUBLIC_SITE_URL"),
    resendApiKey: readEnv("RESEND_API_KEY"),
    emailFrom: readEnv("EMAIL_FROM"),
    openrouterApiKey: readEnv("OPENROUTER_API_KEY"),
    uploadthingToken: readEnv("UPLOADTHING_TOKEN"),
    siteUrl: readEnv("NEXT_PUBLIC_SITE_URL") || readEnv("VITE_SITE_URL"),
    newAccountAllowedEmails: readEnv("NEW_ACCOUNT_ALLOWED_EMAILS"),
    authPreviewHostSuffix: readEnv("AUTH_PREVIEW_HOST_SUFFIX"),
    githubToken: readEnv("GITHUB_TOKEN") || readEnv("GH_TOKEN"),
  };
}
