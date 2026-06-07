import { describe, expect, it } from 'vitest'
import { injectCspNonceIntoHtml } from '@/src/server/lib/index-html'

describe('injectCspNonceIntoHtml', () => {
  it('adds nonce to script tags without exposing it in a meta tag', () => {
    const html = `<!DOCTYPE html>
<html>
  <head><title>Test</title></head>
  <body>
    <script type="module" src="/assets/index-abc12345.js"></script>
    <script type="application/ld+json">{"@context":"https://schema.org"}</script>
  </body>
</html>`

    const out = injectCspNonceIntoHtml(html, 'test-nonce-value')

    expect(out).toContain('<script nonce="test-nonce-value" type="module"')
    expect(out).toContain('<script nonce="test-nonce-value" type="application/ld+json"')
    expect(out).not.toContain('meta name="csp-nonce"')
  })

  it('does not duplicate nonce attributes', () => {
    const html = '<script nonce="existing" src="/app.js"></script>'
    expect(injectCspNonceIntoHtml(html, 'new-nonce')).toBe(html)
  })
})
