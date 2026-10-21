import { describe, expect, it } from 'vitest'
import { formatReportedDate } from './format'

describe('formatReportedDate', () => {
  it('does not invent a date for missing data', () => {
    expect(formatReportedDate(null)).toBe('—')
  })
  it('uses the actual reporting date', () => {
    expect(formatReportedDate('2026-10-20', 'en-IN')).toContain('2026')
  })
})

