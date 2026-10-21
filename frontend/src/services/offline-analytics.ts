/** Pure, source-verified offline computations. Never fabricate missing prices/dates. */
import type { MarketPrice, PriceResponse, TrendResponse, MandiSnapshot } from '../types/mandi'

const eq = (a: string | null | undefined, b: string) => (a ?? '').toLocaleLowerCase() === b.toLocaleLowerCase()

export function offlineCompare(snapshot: MandiSnapshot, input: {
  state: string; district: string; commodity: string; variety: string; grade: string
}): PriceResponse {
  if (!snapshot.metadata.verified) return { records: [], count: 0, verified: false, latest_report_date: null, origin: 'bundled-snapshot' }
  const matched = snapshot.records.filter((r) =>
    eq(r.state, input.state) && eq(r.district, input.district)
    && eq(r.commodity, input.commodity) && eq(r.variety, input.variety)
    && eq(r.grade, input.grade) && r.modal_price !== null)
  const byMarket = new Map<string, MarketPrice>()
  for (const record of [...matched].sort((a,b) => b.arrival_date.localeCompare(a.arrival_date))) {
    const key = [record.state, record.district, record.market, record.variety, record.grade].map(x => x?.toLocaleLowerCase() ?? '').join('|')
    if (!byMarket.has(key)) byMarket.set(key, record)
  }
  const records = [...byMarket.values()]
  return {
    records, count: records.length, verified: true,
    latest_report_date: records.reduce<string | null>((best, r) => !best || r.arrival_date > best ? r.arrival_date : best, null),
    origin: 'bundled-snapshot',
  }
}

export function offlineTrends(snapshot: MandiSnapshot, filters: {
  state: string; district: string; commodity: string; market: string;
  variety?: string; grade?: string; from_date?: string
}): TrendResponse {
  if (!snapshot.metadata.verified) return {observations:[],verified:false,message:'No verified offline observations'}
  let matched = snapshot.records.filter(r =>
    eq(r.state,filters.state) && eq(r.district,filters.district)
    && eq(r.commodity,filters.commodity) && eq(r.market,filters.market)
    && (filters.variety === undefined || eq(r.variety,filters.variety))
    && (filters.grade === undefined || eq(r.grade,filters.grade))
    && (!filters.from_date || r.arrival_date >= filters.from_date))
  const kinds = new Set(matched.map(r => (r.variety ?? '').toLowerCase()))
  const grades = new Set(matched.map(r => (r.grade ?? '').toLowerCase()))
  if (kinds.size > 1 || grades.size > 1) return {
    observations:[],verified:true,message:'Select a single variety and grade for a comparable trend',
  }
  matched = [...matched].sort((a,b) => b.arrival_date.localeCompare(a.arrival_date))
  const byDay = new Map<string,MarketPrice>()
  for (const r of matched) if (r.modal_price !== null && !byDay.has(r.arrival_date)) byDay.set(r.arrival_date,r)
  const observations = [...byDay.values()].sort((a,b) => a.arrival_date.localeCompare(b.arrival_date))
    .map(r => ({report_date:r.arrival_date,modal_price:r.modal_price!,market:r.market,variety:r.variety}))
  return {observations,verified:true,message:observations.length ? null : 'No verified historical observations reported'}
}
