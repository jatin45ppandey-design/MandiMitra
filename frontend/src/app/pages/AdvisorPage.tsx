import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { MessageCircle, ShieldCheck, Volume2 } from 'lucide-react'
import { useAppState } from '../app-state-context'
import { PriceSearchPanel } from '../../features/mandi-prices/PriceSearchPanel'
import { useMarketSearch } from '../../hooks/useMarketSearch'
import { askAdvisor } from '../../services/api'
import { formatCurrency, formatReportedDate } from '../../utils/format'

export function AdvisorPage() {
  const {language} = useAppState()
  const market=useMarketSearch()
  const [question,setQuestion]=useState('')
  const advisor=useMutation({mutationFn:askAdvisor})
  const record=market.selectedRecord
  const ready=Boolean(record && market.pricesQuery.data?.verified && record.variety && record.grade)
  const submit=(event:FormEvent)=>{
    event.preventDefault()
    if(!record?.variety || !record.grade || question.trim().length < 5) return
    advisor.mutate({
      question:question.trim(),state:record.state,district:record.district,commodity:record.commodity,
      variety:record.variety,grade:record.grade,market:record.market,language,
    })
  }
  const speak=()=>{
    if (!advisor.data || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const voice=new SpeechSynthesisUtterance(advisor.data.answer)
    voice.lang=language==='hi'?'hi-IN':'en-IN'
    voice.rate=0.9
    window.speechSynthesis.speak(voice)
  }
  return <div className="mx-auto max-w-4xl">
    <header className="mb-6">
      <h1 className="flex items-center gap-3 text-3xl font-extrabold text-forest-950">
        <MessageCircle size={30}/>{language==='hi'?'मंडीमित्र से पूछें':'Ask MandiMitra'}
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink-600">
        {language==='hi'?'केवल उपलब्ध सरकारी रिकॉर्ड के आधार पर भाव समझें।':'Understand reported rates using available verified records.'}
      </p>
    </header>
    <PriceSearchPanel market={market} includeMarket compact/>
    <form onSubmit={submit} className="mt-5 rounded-3xl bg-paper p-5 shadow-panel sm:p-7">
      <label htmlFor="farmer-question" className="block font-bold text-forest-950">
        {language==='hi'?'आपका सवाल':'Your question'}
      </label>
      <textarea id="farmer-question" value={question} onChange={event=>setQuestion(event.target.value)}
        maxLength={400} rows={3} className="mt-3 w-full rounded-xl border border-sage-200 p-3 outline-none focus:border-forest-700"
        placeholder={language==='hi'?'इस मंडी के रिपोर्टेड भाव का मतलब समझाओ':'Explain the latest reported price for this crop'} />
      {!ready ? <p className="mt-2 text-sm text-harvest-600">
        {language==='hi'?'पहले सत्यापित रिकॉर्ड, किस्म और ग्रेड चुनें।':'Select a verified record, variety and grade first.'}
      </p> : null}
      <button type="submit" disabled={!ready || question.trim().length<5 || advisor.isPending}
        className="mt-4 min-h-12 rounded-xl bg-forest-900 px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
        {advisor.isPending?(language==='hi'?'जवाब तैयार हो रहा है…':'Preparing response…'):(language==='hi'?'जवाब देखें':'Ask')}
      </button>
      {advisor.isError?<p role="alert" className="mt-3 text-sm text-red-700">{advisor.error.message}</p>:null}
    </form>
    {advisor.data ? <section className="mt-5 rounded-3xl bg-sage-100 p-5 sm:p-7" aria-live="polite">
      <h2 className="flex items-center gap-2 text-lg font-bold text-forest-950"><ShieldCheck size={20}/>
        {language==='hi'?'रिकॉर्ड आधारित जवाब':'Record-grounded explanation'}</h2>
      <p className="mt-4 whitespace-pre-line text-base leading-8 text-forest-950">{advisor.data.answer}</p>
      <button type="button" onClick={speak} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 font-semibold">
        <Volume2 size={18}/>{language==='hi'?'जवाब सुनें':'Listen'}
      </button>
      <h3 className="mt-6 font-bold text-forest-950">{language==='hi'?'संबंधित सरकारी रिकॉर्ड':'Evidence used'}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {advisor.data.evidence.map((e,i)=><article key={i} className="rounded-xl bg-white p-4">
          <p className="font-semibold text-forest-950">{e.market}</p>
          <p className="mt-1 text-xl font-bold text-forest-950">{formatCurrency(e.modal_price,language)}</p>
          <p className="text-xs text-ink-600">{formatReportedDate(e.report_date,language==='hi'?'hi-IN':'en-IN')} · {e.source}</p>
        </article>)}
      </div>
      <p className="mt-4 text-xs text-ink-600">{advisor.data.disclaimer}</p>
    </section> : null}
  </div>
}
