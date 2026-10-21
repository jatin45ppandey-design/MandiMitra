import { useState } from 'react'
import { ArrowUpRight, Sprout } from 'lucide-react'
import { BackendStatus } from '../components/common/BackendStatus'
import { LanguageSwitch } from '../features/farmer-preferences/LanguageSwitch'
import { CompareSection } from '../features/market-comparison/CompareSection'
import { PriceCard } from '../features/mandi-prices/PriceCard'
import { TrendSection } from '../features/price-trends/TrendSection'
import { TransportSection } from '../features/transport-calculator/TransportSection'
import { copy, type Language } from '../i18n/translations'

export function App() {
  const [language, setLanguage] = useState<Language>('hi')
  const t = copy[language]
  return (
    <div className="min-h-screen bg-[#f7f9f5] text-emerald-950" lang={language}>
      <header className="border-b border-emerald-900/10 bg-[#f7f9f5]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-emerald-900 text-[#d9edab]">
              <Sprout size={24} strokeWidth={2.4} aria-hidden="true"/>
            </div>
            <div>
              <div className="text-xl font-black leading-tight tracking-tight">MandiMitra</div>
              <div className="text-xs font-medium text-emerald-900/65">{t.tagline}</div>
            </div>
          </div>
          <LanguageSwitch language={language} onChange={setLanguage} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-14 pt-10 md:px-8 md:pt-14">
        <div className="mb-9 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-[#ebf2de] px-4 py-2 text-xs font-semibold text-emerald-900">
            <Sprout size={14} aria-hidden="true" /> {t.demo}
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-emerald-950 md:text-5xl">{t.headline}</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">{t.subheading}</p>
        </div>
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <label className="block rounded-2xl border border-emerald-900/10 bg-white p-4 text-sm font-semibold">
            <span className="mb-2 block">{t.crop}</span>
            <select disabled value="" onChange={() => {}} className="min-h-12 w-full cursor-not-allowed rounded-xl bg-[#f1f5ec] px-4 text-sm text-slate-500" aria-label={t.crop}>
              <option value="">{t.chooseCrop}</option>
            </select>
          </label>
          <label className="block rounded-2xl border border-emerald-900/10 bg-white p-4 text-sm font-semibold">
            <span className="mb-2 block">{t.district}</span>
            <select disabled value="" onChange={() => {}} className="min-h-12 w-full cursor-not-allowed rounded-xl bg-[#f1f5ec] px-4 text-sm text-slate-500" aria-label={t.district}>
              <option value="">{t.chooseDistrict}</option>
            </select>
          </label>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <PriceCard language={language} />
          <TrendSection language={language} />
          <CompareSection language={language} />
          <TransportSection language={language} />
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#e8efdf] px-5 py-4 text-xs text-emerald-900/75">
          <span className="max-w-xl">{t.notice}</span>
          <ArrowUpRight size={18} aria-hidden="true"/>
        </div>
      </main>
      <footer className="border-t border-emerald-900/10 px-5 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 md:px-3">
          <span className="text-xs font-semibold text-emerald-900/65">MandiMitra · Phase 0</span>
          <BackendStatus language={language} />
        </div>
      </footer>
    </div>
  )
}

