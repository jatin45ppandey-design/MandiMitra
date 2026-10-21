import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDownUp, CalendarDays, ChevronDown, MapPinned } from 'lucide-react'
import { useAppState } from '../../app/app-state-context'
import { Button } from '../../components/ui/Button'
import { FeedbackPanel } from '../../components/ui/FeedbackPanel'
import { Skeleton } from '../../components/ui/Skeleton'
import type { useMarketSearch } from '../../hooks/useMarketSearch'
import { translate } from '../../i18n/translations'
import { compareMarkets } from '../../services/api'
import { formatCurrency, formatReportedDate, recordIdentity } from '../../utils/format'
import { TransportSection } from '../transport-calculator/TransportSection'

type MarketSearchState = ReturnType<typeof useMarketSearch>
type SortMode = 'rate' | 'freshness'

export function CompareSection({ market }: { market: MarketSearchState }) {
  const { language } = useAppState()
  const [sortMode, setSortMode] = useState<SortMode>('rate')
  const [expandedRecord, setExpandedRecord] = useState('')
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key)
  const canCompare = Boolean(
    market.ready && market.effectiveVariety && market.effectiveGrade && !market.requiresVariety && !market.requiresGrade,
  )
  const comparisonQuery = useQuery({
    queryKey: [
      'market-comparison',
      market.selections.state,
      market.selections.district,
      market.selections.commodity,
      market.effectiveVariety,
      market.effectiveGrade,
    ],
    queryFn: () =>
      compareMarkets({
        state: market.selections.state,
        district: market.selections.district,
        commodity: market.selections.commodity,
        variety: market.effectiveVariety,
        grade: market.effectiveGrade,
      }),
    enabled: canCompare,
    staleTime: 5 * 60_000,
  })
  const records = useMemo(() => {
    const source = comparisonQuery.data?.records ?? []
    return source.toSorted((a, b) => {
      if (sortMode === 'freshness') return b.arrival_date.localeCompare(a.arrival_date)
      return (b.modal_price ?? -1) - (a.modal_price ?? -1)
    })
  }, [comparisonQuery.data?.records, sortMode])
  const selectedPrice = market.selectedRecord?.modal_price ?? null

  return (
    <section className="rounded-3xl bg-paper p-5 shadow-panel sm:p-7" aria-labelledby="compare-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-2xl items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sage-100 text-forest-800">
            <MapPinned size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 id="compare-heading" className="text-xl font-bold tracking-tight text-forest-950">{t('compareHeadline')}</h2>
            <p className="mt-1 text-sm leading-6 text-ink-600">{t('compareIntro')}</p>
          </div>
        </div>
        {records.length > 1 ? (
          <label className="flex min-h-11 items-center gap-2 rounded-xl bg-sage-50 px-3 text-sm font-semibold text-forest-950 outline outline-1 -outline-offset-1 outline-transparent focus-within:outline-3 focus-within:outline-harvest-500">
            <ArrowDownUp size={17} aria-hidden="true" />
            <select aria-label={t('sortFreshness')} value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="bg-sage-50 text-forest-950 outline-none">
              <option value="rate">{t('sortRate')}</option>
              <option value="freshness">{t('sortFreshness')}</option>
            </select>
          </label>
        ) : null}
      </div>
      {!canCompare ? <div className="mt-6"><FeedbackPanel title={t('compareNeedsDetails')} description={t('searchHelp')} /></div> : null}
      {comparisonQuery.isPending && canCompare ? (
        <div className="mt-6 grid gap-3" aria-label={t('compareLoading')}>
          <Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
      ) : null}
      {comparisonQuery.isError ? (
        <div className="mt-6"><FeedbackPanel kind="error" title={t('genericError')} actionLabel={t('retry')} onAction={() => void comparisonQuery.refetch()} /></div>
      ) : null}
      {comparisonQuery.isSuccess && (!comparisonQuery.data.verified || records.length === 0) ? (
        <div className="mt-6"><FeedbackPanel title={t('compareEmpty')} description={!comparisonQuery.data.verified ? t('unverifiedPrice') : undefined} /></div>
      ) : null}
      {comparisonQuery.data?.verified && records.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {records.map((record) => {
            const identity = recordIdentity(record)
            const expanded = identity === expandedRecord
            const difference = selectedPrice !== null && record.modal_price !== null ? record.modal_price - selectedPrice : null
            return (
              <article key={identity} className="overflow-hidden rounded-2xl bg-sage-50">
                <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-forest-950">{record.market}</h3>
                    <p className="mt-1 text-sm text-ink-600">{record.variety ?? '—'} · {record.grade ?? '—'}</p>
                    <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-ink-600">
                      <CalendarDays size={15} aria-hidden="true" />
                      {formatReportedDate(record.arrival_date, language === 'hi' ? 'hi-IN' : 'en-IN')}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="tabular-nums text-2xl font-extrabold tracking-tight text-forest-950">{formatCurrency(record.modal_price, language)}</p>
                    <p className="text-xs text-ink-600">{t('perQuintal')}</p>
                    {difference !== null ? (
                      <p className={`tabular-nums mt-2 text-xs font-semibold ${difference > 0 ? 'text-forest-700' : difference < 0 ? 'text-red-700' : 'text-ink-600'}`}>
                        {t('difference')}: {difference > 0 ? '+' : ''}{formatCurrency(difference, language)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <Button
                    type="button"
                    variant="secondary"
                    aria-expanded={expanded}
                    onClick={() => setExpandedRecord(expanded ? '' : identity)}
                  >
                    {t('estimateForMarket')}
                    <ChevronDown size={17} className={`transition ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </Button>
                </div>
                {expanded ? (
                  <div className="bg-paper p-3 sm:p-4">
                    <TransportSection key={identity} record={record} verified compact />
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

