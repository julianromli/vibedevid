import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_LOCATION = window.location

afterEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: ORIGINAL_LOCATION,
  })
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('reportClientError', () => {
  it('reports only pathname, not query or hash', async () => {
    vi.stubEnv('PROD', 'true')
    vi.stubEnv('DEV', '')

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/dashboard/settings',
        href: 'https://example.com/dashboard/settings?token=secret#fragment',
      },
    })

    const beacon = vi.fn(() => true)
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: beacon,
    })

    const { reportClientError } = await import('@/lib/client-error-reporting')
    reportClientError(new Error('boom'), { boundary: 'test' })

    expect(beacon).toHaveBeenCalledOnce()
    const blob = beacon.mock.calls[0]?.[1] as Blob
    const body = JSON.parse(await blob.text())
    expect(body.path).toBe('/dashboard/settings')
    expect(body.url).toBeUndefined()
    expect(JSON.stringify(body)).not.toContain('token=secret')
    expect(JSON.stringify(body)).not.toContain('fragment')
  })
})
