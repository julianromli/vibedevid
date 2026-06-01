import { describe, expect, it } from 'vitest'
import { renderPageMetaTags } from '@/lib/seo/render-meta'

describe('renderPageMetaTags', () => {
  it('escapes script-breakout sequences in JSON-LD', () => {
    const tags = renderPageMetaTags({
      title: 'Test',
      description: 'Test',
      canonical: 'https://example.com',
      jsonLd: {
        '@context': 'https://schema.org',
        name: '</script><script>alert(1)</script>',
      },
    })

    expect(tags).toContain('\\u003c/script')
    expect(tags).not.toMatch(/<\/script><script>/)
  })
})
