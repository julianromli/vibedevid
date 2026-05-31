import { createServerClient } from '@supabase/ssr'
import { getSupabaseConfig } from '../env-config'
import { getRequestContext } from '../request-context'

export async function createClient() {
  const store = getRequestContext()

  if (store.supabase) {
    return store.supabase
  }

  const { url, anonKey } = getSupabaseConfig()
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(store.getCookieHeader())
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          store.pendingCookies.push({ name, value, options })
        }
      },
    },
  })
}

export { createClient as createServerClient }

function parseCookieHeader(header: string): { name: string; value: string }[] {
  if (!header) return []
  return header
    .split(';')
    .map((part) => {
      const [name, ...rest] = part.trim().split('=')
      return { name: name.trim(), value: decodeURIComponent(rest.join('=').trim()) }
    })
    .filter((c) => c.name)
}
