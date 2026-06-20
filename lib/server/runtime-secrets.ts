// Server-only runtime secret access.
//
// On Cloudflare Workers, environment variables/secrets are NOT reliably
// exposed via `process.env` (Nitro's shim is populated lazily and cached
// inconsistently). The Cloudflare module handler assigns the per-request
// bindings to `globalThis.__env__`, which is the portable way to read secrets
// at runtime. We fall back to `process.env` for node-server / local dev / tests.
//
// NEVER import this module from client-reachable code — it exposes the
// Supabase service role key and other secrets.

interface ServerRuntimeSecrets {
  supabaseServiceRoleKey: string;
  supabaseUrl: string;
  openrouterApiKey: string;
  uploadthingToken: string;
  siteUrl: string;
}

type EnvRecord = Record<string, string | undefined>;

function readEnv(name: string): string {
  // Cloudflare Workers: per-request bindings set by the Nitro CF handler.
  const cfEnv = (globalThis as { __env__?: EnvRecord }).__env__;
  const fromCf = cfEnv?.[name];
  if (typeof fromCf === "string" && fromCf.length > 0) {
    return fromCf;
  }

  // node-server / dev / tests.
  const fromProcess = typeof process !== "undefined" ? process.env?.[name] : undefined;
  return fromProcess || "";
}

export function getServerRuntimeSecrets(): ServerRuntimeSecrets {
  return {
    supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    openrouterApiKey: readEnv("OPENROUTER_API_KEY"),
    uploadthingToken: readEnv("UPLOADTHING_TOKEN"),
    siteUrl: readEnv("NEXT_PUBLIC_SITE_URL"),
  };
}
