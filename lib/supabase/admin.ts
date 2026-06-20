import { createClient } from "@supabase/supabase-js";
import { getServerRuntimeSecrets } from "../server/runtime-secrets";

// Admin client dengan service role key untuk server-side operations.
//
// Reads the Supabase URL + service role key from Nitro runtime config, which
// is the portable way to access secrets on Cloudflare Workers (where env vars
// are only available within the request lifecycle). Async because runtime
// config is resolved per-request.
export async function createAdminClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getServerRuntimeSecrets();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // Force the runtime-native fetch (Cloudflare Workers / browser) so
    // supabase-js never falls back to `@supabase/node-fetch`, which imports
    // `node:http` and is unavailable on Workers even with nodejs_compat.
    global: {
      fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    },
  });
}
