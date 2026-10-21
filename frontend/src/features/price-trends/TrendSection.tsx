import { lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChartNoAxesCombined } from 'lucide-react'
import { useAppState } from '../../app/app-state-context'
import { FeedbackPanel } from '../../components/ui/FeedbackPanel'
import { Skeleton } from '../../components/ui/Skeleton'
import type { useMarketSearch } from '../../hooks/useMarketSearch'
import { translate } from '../../i18n/translations'
import { getTrends } from '../../services/api'
import { formatCurrency } from '../../utils/format'

const TrendChart = lazy(() => import('./TrendChart'))
type MarketSearchState = ReturnType<typeof useMarketSearch>

export function TrendSection({ market }: { market: MarketSearchState }) {
  const { language } = useAppState()
  const record = market.selectedRecord
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key)
  const trendQuery = useQuery({
    queryKey: [
      'trends',
      record?.state,
      record?.district,
      record?.commodity,
      record?.market,
      record?.variety,
    ],
    queryFn: () =>
      getTrends({
        state: record!.state,
        district: record!.district,
        commodity: record!.commodity,
        market: record!.market,
        variety: record!.variety ?? undefined,
      }),
    enabled: Boolean(record && market.pricesQuery.data?.verified),
    staleTime: 5 * 60_000,
  })
  const observations = trendQuery.data?.observations ?? []
  const previous = observations.at(-2)
  const latest = observations.at(-1)
  const change = latest && previous ? latest.modal_price - previous.modal_price : null
  const MovementIcon = change === null || change === 0 ? ArrowRight : change > 0 ? ArrowUpRight : ArrowDownRight

  return (
    <section className="rounded-3xl bg-paper p-5 shadow-panel sm:p-7" aria-labelledby="trend-heading">
      <div className="mb-6 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sage-100 text-forest-800">
          <ChartNoAxesCombined size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 id="trend-heading" className="text-xl font-bold tracking-tight text-forest-950">{t('trendTitle')}</h2>
          <p className="mt-1 text-sm leading-6 text-ink-600">{t('trendIntro')}</p>
        </div>
      </div>
      {!record ? <FeedbackPanel compact title={t('trendNeedsMarket')} /> : null}
      {record && trendQuery.isPending ? (
        <div aria-label={t('trendLoading')}>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : null}
      {record && trendQuery.isError ? (
        <FeedbackPanel kind="error" compact title={t('genericError')} actionLabel={t('retry')} onAction={() => void trendQuery.refetch()} />
      ) : null}
      {record && trendQuery.isSuccess && observations.length < 2 ? (
        <FeedbackPanel compact title={t('trendEmpty')} description={trendQuery.data.message ?? undefined} />
      ) : null}
      {observations.length >= 2 ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sage-50 px-4 py-3">
            <div className="flex items-center gap-2 font-semibold text-forest-950">
              <MovementIcon size={19} className={change !== null && change < 0 ? 'text-red-700' : 'text-forest-700'} aria-hidden="true" />
              {change === 0 ? t('unchanged') : change && change > 0 ? t('increased') : t('decreased')}
            </div>
            <div className="text-right">
              <p className="tabular-nums font-bold text-forest-950">{change === null ? '—' : formatCurrency(Math.abs(change), language)}</p>
              <p className="text-xs text-ink-600">{t('comparedWithPrevious')}</p>
            </div>
          </div>
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <TrendChart observations={observations} language={language} />
          </Suspense>
        </>
      ) : null}
    </section>
  )
}

