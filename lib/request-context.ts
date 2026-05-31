import { AsyncLocalStorage } from 'node:async_hooks'
import type { CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export type CookieRecord = { name: string; value: string; options?: CookieOptions }

export type RequestContext = {
  supabase: SupabaseClient
  pendingCookies: CookieRecord[]
  getCookieHeader: () => string
}

export const requestContext = new AsyncLocalStorage<RequestContext>()

export function getRequestContext(): RequestContext {
  const ctx = requestContext.getStore()
  if (!ctx) {
    throw new Error('Request context is not available. API handlers must run inside request middleware.')
  }
  return ctx
}

export function runWithRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  return requestContext.run(ctx, fn)
}
