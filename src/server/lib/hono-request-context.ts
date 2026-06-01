import { createServerClient } from '@supabase/ssr'
import type { Context } from 'hono'
import { setCookie } from 'hono/cookie'
import { getSupabaseConfig } from '@/lib/env-config'
import { type CookieRecord, type RequestContext, runWithRequestContext } from '@/lib/request-context'

function parseCookieHeader(header: string): { name: string; value: string }[] {
  if (!header) return []
  return header
    .split(';')
    .map((part) => {
      const [name, ...rest] = part.trim().split('=')
      return { name: name.trim(), value: rest.join('=').trim() }
    })
    .filter((entry) => entry.name)
}

export async function runWithHonoRequestContext<T>(c: Context, fn: () => Promise<T>): Promise<T> {
  const pendingCookies: CookieRecord[] = []
  const { url, anonKey } = getSupabaseConfig()

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(c.req.header('cookie') ?? '')
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          pendingCookies.push({ name, value, options })
          setCookie(c, name, value, {
            path: options?.path ?? '/',
            maxAge: options?.maxAge,
            domain: options?.domain,
            sameSite: options.sameSite as 'Lax' | 'Strict' | 'None' | undefined,
            secure: options?.secure,
            httpOnly: options?.httpOnly,
          })
        }
      },
    },
  })

  const ctx: RequestContext = {
    supabase,
    pendingCookies,
    getCookieHeader: () => c.req.header('cookie') ?? '',
  }

  const result = await runWithRequestContext(ctx, async () => {
    await supabase.auth.getUser()
    return fn()
  })

  for (const cookie of pendingCookies) {
    setCookie(c, cookie.name, cookie.value, {
      path: cookie.options?.path ?? '/',
      maxAge: cookie.options?.maxAge,
      domain: cookie.options?.domain,
      sameSite: cookie.options?.sameSite as 'Lax' | 'Strict' | 'None' | undefined,
      secure: cookie.options?.secure,
      httpOnly: cookie.options?.httpOnly,
    })
  }

  return result
}

export function getCookieLocale(c: Context): string | null {
  return c.req.header('cookie')?.match(/NEXT_LOCALE=([^;]+)/)?.[1] ?? null
}
