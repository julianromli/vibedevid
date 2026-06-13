import { describe, expect, it } from 'vitest'
import { normalizeProfileSocialUrl, normalizeProfileWebsiteUrl } from '@/lib/profile-social-links'

describe('profile social link normalization', () => {
  it('normalizes Threads URLs to the canonical @handle path', () => {
    expect(normalizeProfileSocialUrl('threads', 'threads.net/jane')).toBe('https://www.threads.net/@jane')
    expect(normalizeProfileSocialUrl('threads', 'https://www.threads.net/@jane/')).toBe('https://www.threads.net/@jane')
  })

  it('treats social handles containing periods as handles', () => {
    expect(normalizeProfileSocialUrl('instagram', 'jane.doe')).toBe('https://instagram.com/jane.doe')
    expect(normalizeProfileSocialUrl('x', '@jane.doe')).toBe('https://x.com/jane.doe')
  })

  it('rejects non-http website schemes instead of returning them unchanged', () => {
    expect(normalizeProfileWebsiteUrl('ftp://example.com')).toBe('')
    expect(normalizeProfileWebsiteUrl('javascript:alert(1)')).toBe('')
  })
})
