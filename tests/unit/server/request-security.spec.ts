import { afterEach, describe, expect, it } from 'vitest'
import { getAllowedOrigins, isAllowedOrigin } from '@/src/server/lib/request-security'

const ORIGINAL_ENV = { ...process.env }

function withEnv(overrides: Record<string, string | undefined>, fn: () => void) {
  Object.assign(process.env, overrides)
  try {
    fn()
  } finally {
    process.env = { ...ORIGINAL_ENV }
  }
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('request-security', () => {
  it('allows the deployment origin from VERCEL_URL on preview', () => {
    withEnv(
      {
        NODE_ENV: 'production',
        VERCEL: '1',
        VERCEL_ENV: 'preview',
        VERCEL_URL: 'my-app-git-feature-user.vercel.app',
        VITE_SITE_URL: '',
        SITE_URL: '',
      },
      () => {
        expect(isAllowedOrigin('https://my-app-git-feature-user.vercel.app')).toBe(true)
      },
    )
  })

  it('denies unrelated vercel.app origins on preview', () => {
    withEnv(
      {
        NODE_ENV: 'production',
        VERCEL: '1',
        VERCEL_ENV: 'preview',
        VERCEL_URL: 'my-app-git-feature-user.vercel.app',
        VITE_SITE_URL: '',
        SITE_URL: '',
      },
      () => {
        expect(isAllowedOrigin('https://evil-other.vercel.app')).toBe(false)
      },
    )
  })

  it('allows localhost only during local development', () => {
    withEnv(
      {
        NODE_ENV: 'development',
        VERCEL: '',
        VITE_SITE_URL: '',
        SITE_URL: '',
      },
      () => {
        const origins = getAllowedOrigins()
        expect(origins.has('http://localhost:5173')).toBe(true)
        expect(origins.has('http://127.0.0.1:5173')).toBe(true)
      },
    )
  })

  it('does not add localhost on Vercel preview', () => {
    withEnv(
      {
        NODE_ENV: 'production',
        VERCEL: '1',
        VERCEL_ENV: 'preview',
        VERCEL_URL: 'my-app.vercel.app',
        VITE_SITE_URL: '',
        SITE_URL: '',
      },
      () => {
        const origins = getAllowedOrigins()
        expect(origins.has('http://localhost:5173')).toBe(false)
      },
    )
  })

  it('honors CORS_ALLOWED_ORIGINS for custom preview hosts', () => {
    withEnv(
      {
        NODE_ENV: 'production',
        VERCEL: '1',
        VERCEL_ENV: 'preview',
        VERCEL_URL: 'my-app.vercel.app',
        CORS_ALLOWED_ORIGINS: 'https://tunnel-123.sslip.io',
        VITE_SITE_URL: '',
        SITE_URL: '',
      },
      () => {
        expect(isAllowedOrigin('https://tunnel-123.sslip.io')).toBe(true)
        expect(isAllowedOrigin('https://other.sslip.io')).toBe(false)
      },
    )
  })
})
