import { describe, expect, it, vi } from 'vitest'
import { createBlogPost } from '@/lib/actions/blog'

vi.mock('@/lib/supabase/client')

describe('blog actions', () => {
  it('createBlogPost returns error for short title', async () => {
    const result = await createBlogPost({ title: 'Hi', content: {} })
    expect(result.success).toBe(false)
    expect(result.error).toContain('5 characters')
  })

  it('createBlogPost returns error for empty content', async () => {
    const result = await createBlogPost({ title: 'Valid Title', content: {} })
    expect(result.success).toBe(false)
    expect(result.error).toContain('too short')
  })
})
