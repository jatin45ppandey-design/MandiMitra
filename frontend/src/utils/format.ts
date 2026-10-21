export function formatReportedDate(isoDate: string | null, locale = 'hi-IN'): string {
  if (!isoDate) return '—'
  const date = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

