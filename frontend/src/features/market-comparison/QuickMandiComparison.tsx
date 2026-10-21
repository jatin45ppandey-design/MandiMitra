import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import type { useMarketSearch } from '../../hooks/useMarketSearch'
import { compareMarkets } from '../../services/api'
import { formatCurrency, formatReportedDate } from '../../utils/format'
import { useAppState } from '../../app/app-state-context'

type MarketState = ReturnType<typeof useMarketSearch>
export function QuickMandiComparison({ market }: {market:MarketState}) {
  const {language} = useAppState()
  const active = Boolean(market.ready && market.effectiveVariety && market.effectiveGrade
    && !market.requiresVariety && !market.requiresGrade)
  const query = useQuery({
    queryKey:['home-quick-compare',market.selections.state,market.selections.district,market.selections.commodity,market.effectiveVariety,market.effectiveGrade],
    queryFn:()=>compareMarkets({
      state:market.selections.state,district:market.selections.district,
      commodity:market.selections.commodity,variety:market.effectiveVariety,grade:market.effectiveGrade,
    }),
    enabled:active,staleTime:5*60_000,
  })
  const records=[...(query.data?.records??[])].sort((a,b)=>b.arrival_date.localeCompare(a.arrival_date)
    || (b.modal_price??0)-(a.modal_price??0)).slice(0,3)
  return <section className="rounded-3xl bg-paper p-5 shadow-panel sm:p-7" aria-label={language==='hi'?'मंडी भाव की छोटी तुलना':'Quick mandi comparison'}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-forest-950">{language==='hi'?'मंडियों का भाव देखें':'Compare mandi rates'}</h2>
        <p className="mt-1 text-sm text-ink-600">{language==='hi'?'समान फसल, किस्म और ग्रेड की रिपोर्टेड दरें':'Reported rates for the same crop, variety and grade'}</p>
      </div>
      <Link to="/compare" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sage-100 px-4 text-sm font-bold text-forest-900">
        {language==='hi'?'पूरी तुलना':'Full comparison'} <ArrowRight size={17}/>
      </Link>
    </div>
    {!active ? <p className="mt-4 text-sm text-ink-600">{language==='hi'?'ऊपर जिला, फसल, किस्म और ग्रेड चुनें।':'Choose district, crop, variety and grade above.'}</p> : null}
    {active && query.isPending ? <p className="mt-4 text-sm text-ink-600">{language==='hi'?'लोड हो रहा है…':'Loading…'}</p> : null}
    {query.isError ? <p role="alert" className="mt-4 text-sm text-red-700">{language==='hi'?'अभी तुलना उपलब्ध नहीं है।':'Comparison temporarily unavailable.'}</p> : null}
    {query.isSuccess && records.length===0 ? <p className="mt-4 text-sm text-ink-600">{language==='hi'?'इस चयन के लिए कोई रिपोर्टेड मंडी भाव नहीं।':'No matching reported mandi rates.'}</p> : null}
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {records.map(r=><article key={[r.state,r.district,r.market,r.arrival_date].join('|')} className="rounded-xl bg-sage-50 p-4">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-forest-950"><MapPin size={15}/>{r.market}</p>
        <p className="mt-3 text-xl font-extrabold text-forest-950 tabular-nums">{formatCurrency(r.modal_price,language)}</p>
        <p className="text-xs text-ink-600">{language==='hi'?'प्रति क्विंटल':'per quintal'}</p>
        <p className="mt-3 text-xs text-ink-600">{formatReportedDate(r.arrival_date,language==='hi'?'hi-IN':'en-IN')}</p>
      </article>)}
    </div>
    {records.length>0 ? <p className="mt-3 text-xs text-ink-600">
      {language==='hi'?'रिपोर्ट की तारीख अलग हो सकती है। अधिक भाव बिक्री की गारंटी नहीं है।':'Report dates may differ. Higher reported rates are not guaranteed offers.'}
    </p> : null}
  </section>
}
