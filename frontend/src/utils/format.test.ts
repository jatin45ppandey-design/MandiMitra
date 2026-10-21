import { describe, expect, it } from 'vitest'
import { formatCurrency, formatReportedDate, getFreshnessDays, uniqueValues } from './format'

describe('formatReportedDate', () => {
  it('does not invent a date for missing data', () => {
    expect(formatReportedDate(null)).toBe('—')
  })
  it('uses the actual reporting date', () => {
    expect(formatReportedDate('2026-10-20', 'en-IN')).toContain('2026')
  })

  it('does not reinterpret fetched time as a reporting date', () => {
    expect(formatReportedDate('2026-01-02', 'en-IN')).toContain('2 Jan 2026')
  })
})

describe('price formatting and freshness', () => {
  it('keeps missing prices explicit', () => {
    expect(formatCurrency(null, 'en')).toBe('—')
  })

  it('calculates age from the report date', () => {
    expect(getFreshnessDays('2026-10-18', new Date('2026-10-21T15:00:00Z'))).toBe(3)
  })

  it('deduplicates only real option values', () => {
    expect(uniqueValues(['Dara', null, 'Dara', 'Lokwan'])).toEqual(['Dara', 'Lokwan'])
  })
})

