import { describe, expect, it } from 'vitest'
import { contentToHtml } from '@/lib/blog-utils'

describe('contentToHtml', () => {
  it('escapes text and code content before injecting HTML', () => {
    const html = contentToHtml({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '<script>alert(1)</script>' }],
        },
      ],
    })

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('drops unsafe link and image URLs', () => {
    const html = contentToHtml({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'bad link',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
            },
          ],
        },
        {
          type: 'image',
          attrs: {
            src: 'javascript:alert(1)',
            alt: '" onerror="alert(1)',
          },
        },
      ],
    })

    expect(html).toContain('bad link')
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('onerror=')
  })
})
