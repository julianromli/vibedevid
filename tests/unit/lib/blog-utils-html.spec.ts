import { describe, expect, it } from 'vite-plus/test'
import { contentToHtmlRecursive } from '@/lib/blog-utils'

describe('contentToHtmlRecursive', () => {
  it('renders a post heading as h2 so the page title stays the only h1', () => {
    const html = contentToHtmlRecursive({
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Judul bagian' }],
    })

    expect(html).toBe('<h2>Judul bagian</h2>')
  })

  it('keeps width and height when the image node has them', () => {
    const html = contentToHtmlRecursive({
      type: 'image',
      attrs: { src: 'https://img.example.com/a.webp', alt: 'Diagram arsitektur', width: 800, height: 450 },
    })

    expect(html).toContain('alt="Diagram arsitektur"')
    expect(html).toContain('width="800"')
    expect(html).toContain('height="450"')
  })
})
