import { describe, expect, it } from 'vite-plus/test'
import { parseEnvFile } from '@/scripts/seed/env'
import { assertSafeSeedTarget, isProductionSiteUrl } from '@/scripts/seed/guards'

describe('isProductionSiteUrl', () => {
  it('treats production hosts as blocked', () => {
    expect(isProductionSiteUrl('https://vibedevid.com')).toBe(true)
    expect(isProductionSiteUrl('https://www.vibedevid.com')).toBe(true)
    expect(isProductionSiteUrl('https://vibedeveloper.id')).toBe(true)
    expect(isProductionSiteUrl('https://www.vibedeveloper.id')).toBe(true)
  })

  it('treats DNS trailing-dot production hosts as blocked', () => {
    expect(isProductionSiteUrl('https://vibedeveloper.id.')).toBe(true)
    expect(isProductionSiteUrl('https://www.vibedevid.com.')).toBe(true)
  })

  it('allows localhost and empty values', () => {
    expect(isProductionSiteUrl('http://localhost:3000')).toBe(false)
    expect(isProductionSiteUrl(undefined)).toBe(false)
    expect(isProductionSiteUrl('')).toBe(false)
  })
})

describe('assertSafeSeedTarget', () => {
  it('throws when a site URL is production and allowProduction is false', () => {
    expect(() =>
      assertSafeSeedTarget({
        siteUrls: ['http://localhost:3000', 'https://vibedevid.com'],
        allowProduction: false,
      }),
    ).toThrow(/Refusing to seed/)
  })

  it('throws when a production URL uses a DNS trailing-dot host', () => {
    expect(() =>
      assertSafeSeedTarget({
        siteUrls: ['https://vibedeveloper.id.'],
        allowProduction: false,
      }),
    ).toThrow(/Refusing to seed/)
  })

  it('allows production when SEED_ALLOW_PRODUCTION is set', () => {
    expect(() =>
      assertSafeSeedTarget({
        siteUrls: ['https://vibedevid.com'],
        allowProduction: true,
      }),
    ).not.toThrow()
  })
})

describe('parseEnvFile', () => {
  it('reads keys and strips quotes', () => {
    const parsed = parseEnvFile(`# comment\nFOO=bar\nBAZ="quoted"\n`)
    expect(parsed).toEqual({ FOO: 'bar', BAZ: 'quoted' })
  })
})
