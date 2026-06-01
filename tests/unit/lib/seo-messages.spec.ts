import { describe, expect, it } from 'vitest'
import { formatTitle } from '@/lib/seo/messages'

describe('formatTitle', () => {
  it('preserves dollar-sign replacement patterns in page titles', () => {
    expect(formatTitle('%s | VibeDev ID', 'My $& Project')).toBe('My $& Project | VibeDev ID')
    expect(formatTitle('%s | VibeDev ID', 'Price $1 deal')).toBe('Price $1 deal | VibeDev ID')
  })
})
