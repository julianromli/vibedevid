import type { Context } from 'hono'
import { getSiteUrl } from '@/lib/seo/site-url'

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function readEnv(key: string): string {
  return typeof process !== 'undefined' ? (process.env[key] ?? '') : ''
}

export function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>()
  const siteOrigin = normalizeOrigin(getSiteUrl())
  if (siteOrigin) origins.add(siteOrigin)

  for (const value of [
    readEnv('VITE_SITE_URL'),
    readEnv('VITE_PUBLIC_SITE_URL'),
    readEnv('NEXT_PUBLIC_SITE_URL'),
    readEnv('SITE_URL'),
    readEnv('VERCEL_PROJECT_PRODUCTION_URL'),
    readEnv('VERCEL_URL'),
  ]) {
    const origin = normalizeOrigin(value)
    if (origin) origins.add(origin)
  }

  if (readEnv('NODE_ENV') !== 'production') {
    origins.add('http://localhost:5173')
    origins.add('http://127.0.0.1:5173')
  }

  return origins
}

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  const normalized = normalizeOrigin(origin)
  return Boolean(normalized && getAllowedOrigins().has(normalized))
}

export function resolveCorsOrigin(origin: string): string {
  if (!origin) return getSiteUrl()
  return isAllowedOrigin(origin) ? origin : getSiteUrl()
}

export function isSameOriginRequest(c: Context): boolean {
  const origin = c.req.header('origin')
  if (!origin) return true
  return isAllowedOrigin(origin)
}
