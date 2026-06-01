import { describe, expect, it } from 'vitest'
import { formatProjectDescription } from '@/lib/project-format-description'

describe('formatProjectDescription', () => {
  it('keeps non-bullet lines between bullets outside the list', () => {
    const html = formatProjectDescription('Features\n- Item A\nAlso supports X\n- Item B')
    expect(html).toContain('Also supports X')
    expect(html).not.toMatch(/<ul[^>]*>[\s\S]*<p>/)
    expect(html).toMatch(/<ul[^>]*>[\s\S]*<li>Item A<\/li>[\s\S]*<\/ul>/)
    expect(html).toMatch(/<ul[^>]*>[\s\S]*<li>Item B<\/li>[\s\S]*<\/ul>/)
  })

  it('does not place paragraphs inside unordered lists', () => {
    const html = formatProjectDescription('- One\nPlain line\n- Two')
    expect(html).not.toMatch(/<ul[^>]*>[\s\S]*<p>Plain line<\/p>[\s\S]*<\/ul>/)
    expect(html).toContain('<p class="mb-4">Plain line</p>')
  })
})
