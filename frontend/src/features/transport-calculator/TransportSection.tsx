import { Truck } from 'lucide-react'
import type { Language } from '../../i18n/translations'
import { copy } from '../../i18n/translations'

export function TransportSection({ language }: { language: Language }) {
  const t = copy[language]
  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-white p-6 md:p-7">
      <div className="mb-4 flex items-center gap-3">
        <Truck className="text-emerald-800" size={23} aria-hidden="true"/>
        <h2 className="text-lg font-bold text-emerald-950">{t.transport}</h2>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">{t.transportEmpty}</p>
    </section>
  )
}

