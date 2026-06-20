import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "../env-config";

export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey, {
    global: {
      fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    },
  });
}
