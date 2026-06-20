import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "../env-config";

export async function createClient() {
  const { url, anonKey } = getSupabaseConfig();

  // Imported lazily so `@tanstack/react-start/server` (whose index statically
  // pulls in the SSR render handlers -> `react-dom/server`, plus Node-only
  // `async_hooks`) never reaches the client bundle. This module is reachable
  // from the client route graph via loaders/actions, so a top-level
  // server-only import would break hydration.
  const { getCookies, setCookie } = await import("@tanstack/react-start/server");

  return createServerClient(url, anonKey, {
    // Force runtime-native fetch so supabase-js never loads
    // `@supabase/node-fetch` (imports `node:http`, unavailable on Workers).
    global: {
      fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    },
    cookies: {
      getAll() {
        const cookies = getCookies();
        return Object.entries(cookies).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            setCookie(name, value, options);
          }
        } catch {
          // Called from a context where response cookies cannot be set.
        }
      },
    },
  });
}

/**
 * Server-only cookie reader. Lazily loads `@tanstack/react-start/server` to keep
 * this module client-safe. Only call from server contexts.
 */
export async function getCookie(name: string) {
  const { getCookie: getCookieImpl } = await import("@tanstack/react-start/server");
  return getCookieImpl(name);
}

export { createClient as createServerClient };
