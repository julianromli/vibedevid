import { describe, expect, it } from 'vitest'
import { computeEventStatus, parseDateOnlyAsLocalDate } from '@/lib/event-status'

function withTimezone(timezone: string, callback: () => void) {
  const originalTimezone = process.env.TZ

  try {
    process.env.TZ = timezone
    callback()
  } finally {
    if (originalTimezone === undefined) {
      delete process.env.TZ
    } else {
      process.env.TZ = originalTimezone
    }
  }
}

describe('event status helpers', () => {
  it('parses date-only strings as local calendar dates', () => {
    withTimezone('America/Los_Angeles', () => {
      const parsed = parseDateOnlyAsLocalDate('2026-05-03')

      expect(parsed.getFullYear()).toBe(2026)
      expect(parsed.getMonth()).toBe(4)
      expect(parsed.getDate()).toBe(3)
      expect(parsed.getHours()).toBe(0)
    })
  })

  it('computes status by local calendar day', () => {
    const today = new Date(2026, 4, 3, 15, 30)

    expect(computeEventStatus('2026-05-02', today)).toBe('past')
    expect(computeEventStatus('2026-05-03', today)).toBe('ongoing')
    expect(computeEventStatus('2026-05-04', today)).toBe('upcoming')
  })

  it('rejects impossible date-only strings', () => {
    expect(() => parseDateOnlyAsLocalDate('2026-02-30')).toThrow('valid calendar date')
  })
})
