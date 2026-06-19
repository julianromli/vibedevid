import { createServerClient } from '@supabase/ssr'
import { getCookie, getCookies, setCookie } from '@tanstack/react-start/server'
import { getSupabaseConfig } from '../env-config'

export async function createClient() {
  const { url, anonKey } = getSupabaseConfig()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        const cookies = getCookies()
        return Object.entries(cookies).map(([name, value]) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            setCookie(name, value, options)
          }
        } catch {
          // Called from a context where response cookies cannot be set.
        }
      },
    },
  })
}

export { createClient as createServerClient, getCookie }
