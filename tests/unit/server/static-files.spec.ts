import { describe, expect, it } from 'vitest'
import { cacheControlForAsset } from '@/src/server/lib/static-files'

describe('static-files cache headers', () => {
  it('uses immutable long-term caching for Vite content-hashed assets', () => {
    expect(cacheControlForAsset('/assets/index-a1b2c3d4.js')).toBe('public, max-age=31536000, immutable')
    expect(cacheControlForAsset('/assets/style-AbCdEfGh.css')).toBe('public, max-age=31536000, immutable')
    expect(cacheControlForAsset('/assets/index-a1b2c3d4e5.js')).toBe('public, max-age=31536000, immutable')
  })

  it('uses shorter caching for non-hashed static assets', () => {
    expect(cacheControlForAsset('/favicon.ico')).toBe('public, max-age=3600')
    expect(cacheControlForAsset('/robots.txt')).toBe('public, max-age=3600')
  })

  it('does not treat dashed filenames outside /assets/ as content-hashed', () => {
    expect(cacheControlForAsset('/images/my-long-filename-here.png')).toBe('public, max-age=3600')
    expect(cacheControlForAsset('/opengraph-image-abcdefgh.png')).toBe('public, max-age=3600')
  })

  it('does not treat /assets/ files without a real content hash as immutable', () => {
    expect(cacheControlForAsset('/assets/legacy-file-abc.js')).toBe('public, max-age=3600')
    expect(cacheControlForAsset('/assets/chunk-map.json')).toBe('public, max-age=3600')
  })
})
