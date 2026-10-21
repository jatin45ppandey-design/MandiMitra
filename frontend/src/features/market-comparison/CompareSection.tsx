import { MapPinned } from 'lucide-react'
import type { Language } from '../../i18n/translations'
import { copy } from '../../i18n/translations'

export function CompareSection({ language }: { language: Language }) {
  const t = copy[language]
  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-white p-6 md:p-7">
      <div className="mb-7 flex items-center gap-3">
        <MapPinned className="text-emerald-800" size={23} aria-hidden="true"/>
        <h2 className="text-lg font-bold text-emerald-950">{t.comparison}</h2>
      </div>
      <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-emerald-900/15 bg-[#f7f9f5] p-6 text-center text-sm text-slate-600">
        {t.compareEmpty}
      </div>
    </section>
  )
}

