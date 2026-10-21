import { BadgeIndianRupee, CalendarDays } from 'lucide-react'
import type { Language } from '../../i18n/translations'
import { copy } from '../../i18n/translations'

export function PriceCard({ language }: { language: Language }) {
  const t = copy[language]
  return (
    <section className="rounded-3xl bg-emerald-900 p-6 text-white shadow-lg shadow-emerald-950/10 md:p-8" aria-labelledby="price-heading">
      <div className="mb-8 flex items-start justify-between">
        <span id="price-heading" className="text-sm font-medium text-emerald-100/90">{t.price}</span>
        <span className="rounded-2xl bg-white/10 p-3"><BadgeIndianRupee size={24} aria-hidden="true" /></span>
      </div>
      <p className="text-3xl font-bold tracking-tight md:text-4xl">{t.emptyPrice}</p>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-emerald-100/80">{t.dataMissing}</p>
      <div className="mt-8 flex items-center gap-2 border-t border-white/15 pt-5 text-xs text-emerald-100/80">
        <CalendarDays size={16} aria-hidden="true" /> {t.source}
      </div>
    </section>
  )
}

