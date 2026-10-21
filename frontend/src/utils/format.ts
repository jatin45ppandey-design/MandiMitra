import type { Language, MarketPrice } from '../types/mandi'

const localeByLanguage: Record<Language, string> = {
  hi: 'hi-IN',
  en: 'en-IN',
}

export function formatReportedDate(
  isoDate: string | null | undefined,
  locale = 'hi-IN',
): string {
  if (!isoDate) return '—'
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function formatFetchedAt(
  isoDate: string | null | undefined,
  language: Language,
): string {
  if (!isoDate) return '—'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(localeByLanguage[language], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatCurrency(
  value: number | null | undefined,
  language: Language,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(localeByLanguage[language], {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function getFreshnessDays(reportDate: string, now = new Date()): number | null {
  const reported = new Date(`${reportDate.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(reported.getTime())) return null
  const currentUtcDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.max(0, Math.floor((currentUtcDay - reported.getTime()) / 86_400_000))
}

export function uniqueValues(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])].sort(
    (a, b) => a.localeCompare(b, 'hi-IN'),
  )
}

export function recordIdentity(record: MarketPrice): string {
  return [
    record.state,
    record.district,
    record.market,
    record.commodity,
    record.variety ?? '',
    record.grade ?? '',
    record.arrival_date,
  ].join('|')
}

