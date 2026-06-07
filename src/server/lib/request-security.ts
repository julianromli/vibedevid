import type { Context } from 'hono'
import { getSiteUrl } from '@/lib/seo/site-url'

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null

  const trimmed = value.trim()
  const withScheme = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`

  try {
    return new URL(withScheme).origin
  } catch {
    return null
  }
}

function readEnv(key: string): string {
  return typeof process !== 'undefined' ? (process.env[key] ?? '') : ''
}

function readCsvOrigins(key: string): string[] {
  const raw = readEnv(key)
  if (!raw) return []
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function isLocalDevelopment(): boolean {
  const vercelEnv = readEnv('VERCEL_ENV')
  if (vercelEnv === 'preview' || vercelEnv === 'production') return false
  return readEnv('NODE_ENV') !== 'production'
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
    readEnv('VERCEL_BRANCH_URL'),
    ...readCsvOrigins('CORS_ALLOWED_ORIGINS'),
  ]) {
    const origin = normalizeOrigin(value)
    if (origin) origins.add(origin)
  }

  if (isLocalDevelopment()) {
    origins.add('http://localhost:5173')
    origins.add('http://127.0.0.1:5173')
  }

  return origins
}

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  const normalized = normalizeOrigin(origin)
  if (!normalized) return false
  return getAllowedOrigins().has(normalized)
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
