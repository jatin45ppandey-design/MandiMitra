import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, Check, Heart, Landmark, RefreshCw, ShieldCheck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAppState } from '../../app/app-state-context'
import { FeedbackPanel } from '../../components/ui/FeedbackPanel'
import { Skeleton } from '../../components/ui/Skeleton'
import type { useMarketSearch } from '../../hooks/useMarketSearch'
import { translate } from '../../i18n/translations'
import { formatCurrency, formatFetchedAt, formatReportedDate, getFreshnessDays } from '../../utils/format'
import { PriceActions } from './PriceActions'
import { getTrends } from '../../services/api'

type MarketSearchState = ReturnType<typeof useMarketSearch>

export function LatestPriceCard({ market }: { market: MarketSearchState }) {
  const { language, savedCrops, toggleSavedCrop } = useAppState()
  const t = (key: Parameters<typeof translate>[1], replacements?: Record<string, string | number>) =>
    translate(language, key, replacements)
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN'
  const chosen = market.selectedRecord
  const movement = useQuery({
    queryKey: ['main-price-movement', chosen?.state, chosen?.district, chosen?.market, chosen?.commodity, chosen?.variety, chosen?.grade],
    queryFn: () => getTrends({
      state: chosen!.state, district: chosen!.district, market: chosen!.market,
      commodity: chosen!.commodity, variety: chosen!.variety ?? undefined,
      grade: chosen!.grade ?? undefined,
    }),
    enabled: Boolean(chosen && market.pricesQuery.data?.verified),
    staleTime: 5 * 60_000,
  })
  const history = movement.data?.observations ?? []
  const last = history.at(-1)
  const before = history.at(-2)
  const difference = last && before ? last.modal_price - before.modal_price : null
  const MovementIcon = difference === null || difference === 0 ? ArrowRight : difference > 0 ? ArrowUpRight : ArrowDownRight

  if (!market.ready) {
    return (
      <section className="rounded-3xl bg-forest-900 p-6 text-white sm:p-8" aria-labelledby="latest-price-heading">
        <h2 id="latest-price-heading" className="text-xl font-bold">{t('latestPrice')}</h2>
        <p className="mt-12 max-w-lg text-lg font-semibold leading-8 text-sage-100">{t('chooseForPrice')}</p>
      </section>
    )
  }

  if (market.pricesQuery.isPending) {
    return (
      <section className="rounded-3xl bg-forest-900 p-6 text-white sm:p-8" aria-label={t('loadingPrice')}>
        <Skeleton className="h-5 w-36 bg-white/10" />
        <Skeleton className="mt-10 h-12 w-52 bg-white/10" />
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Skeleton className="h-20 bg-white/10" />
          <Skeleton className="h-20 bg-white/10" />
        </div>
      </section>
    )
  }

  if (market.pricesQuery.isError) {
    return (
      <section className="rounded-3xl bg-white p-5 shadow-panel sm:p-7" aria-labelledby="latest-price-heading">
        <h2 id="latest-price-heading" className="mb-5 text-xl font-bold text-forest-950">{t('latestPrice')}</h2>
        <FeedbackPanel
          kind="error"
          title={t('genericError')}
          actionLabel={t('retry')}
          onAction={() => void market.pricesQuery.refetch()}
        />
      </section>
    )
  }

  if (market.requiresVariety || market.requiresGrade) {
    return (
      <section className="rounded-3xl bg-white p-5 shadow-panel sm:p-7" aria-labelledby="latest-price-heading">
        <h2 id="latest-price-heading" className="mb-5 text-xl font-bold text-forest-950">{t('latestPrice')}</h2>
        <FeedbackPanel title={t('compareNeedsDetails')} description={t('searchHelp')} />
      </section>
    )
  }

  const record = market.selectedRecord
  if (!record) {
    return (
      <section className="rounded-3xl bg-white p-5 shadow-panel sm:p-7" aria-labelledby="latest-price-heading">
        <h2 id="latest-price-heading" className="mb-5 text-xl font-bold text-forest-950">{t('latestPrice')}</h2>
        <FeedbackPanel title={t('noPrice')} description={t('noPriceHelp')} />
      </section>
    )
  }

  if (!market.pricesQuery.data?.verified) {
    return (
      <section className="rounded-3xl bg-white p-5 shadow-panel sm:p-7" aria-labelledby="latest-price-heading">
        <h2 id="latest-price-heading" className="mb-5 text-xl font-bold text-forest-950">{t('latestPrice')}</h2>
        <FeedbackPanel kind="error" title={t('unverifiedPrice')} description={t('noPriceHelp')} />
      </section>
    )
  }

  const freshnessDays = getFreshnessDays(record.arrival_date)
  const stale = freshnessDays !== null && freshnessDays > 3
  const isSaved = savedCrops.includes(record.commodity)

  return (
    <section className="overflow-hidden rounded-3xl bg-forest-900 text-white shadow-panel" aria-labelledby="latest-price-heading">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-sage-100">
              <ShieldCheck size={18} aria-hidden="true" /> {t('verifiedRecord')}
            </div>
            <h2 id="latest-price-heading" className="mt-3 text-xl font-bold">{t('latestPrice')}</h2>
          </div>
          <button
            type="button"
            aria-pressed={isSaved}
            onClick={() => toggleSavedCrop(record.commodity)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-3 text-sm font-semibold transition hover:bg-white/15 focus-visible:outline-3 focus-visible:outline-harvest-500"
          >
            {isSaved ? <Check size={17} aria-hidden="true" /> : <Heart size={17} aria-hidden="true" />}
            {t(isSaved ? 'cropSaved' : 'saveCrop')}
          </button>
        </div>
        <div className="mt-8">
          <p className="text-sm font-medium text-sage-200">{record.commodity} · {record.market}</p>
          <p className="tabular-nums mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {formatCurrency(record.modal_price, language)}
          </p>
          <p className="mt-1 text-sm text-sage-200">{t('perQuintal')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white">
            <MovementIcon size={20} aria-hidden="true"/>
            {difference === null ? (language === 'hi' ? 'पिछला तुलनीय रिपोर्टेड भाव उपलब्ध नहीं' : 'No previous comparable report')
              : difference === 0 ? t('unchanged')
              : (difference > 0 ? t('increased') : t('decreased')) + ': ' + formatCurrency(Math.abs(difference), language)}
            {before ? <span className="text-xs text-sage-200">
              ({formatReportedDate(before.report_date, locale)} {language === 'hi' ? 'से' : 'vs previous'})
            </span> : null}
          </div>
          {market.pricesQuery.data?.origin === 'bundled-snapshot' ? (
            <p className="mt-3 text-xs font-semibold text-sage-100">
              {language === 'hi' ? 'ऑफ़लाइन सहेजा गया सत्यापित रिकॉर्ड' : 'Bundled verified offline record'}
            </p>
          ) : null}
        </div>
        <dl className="mt-7 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/8 p-4">
            <dt className="text-xs font-medium text-sage-200">{t('minPrice')}</dt>
            <dd className="tabular-nums mt-1 text-lg font-bold">{formatCurrency(record.min_price, language)}</dd>
          </div>
          <div className="rounded-2xl bg-white/8 p-4">
            <dt className="text-xs font-medium text-sage-200">{t('maxPrice')}</dt>
            <dd className="tabular-nums mt-1 text-lg font-bold">{formatCurrency(record.max_price, language)}</dd>
          </div>
        </dl>
        <div className={`mt-5 rounded-2xl px-4 py-3 text-sm leading-6 ${stale ? 'bg-harvest-100 text-harvest-600' : 'bg-white/9 text-sage-100'}`}>
          {stale && freshnessDays !== null ? t('staleData', { days: freshnessDays }) : t('freshData')}
        </div>
        <PriceActions record={record} language={language} />
      </div>
      <div className="bg-[#103c2e] px-6 py-5 sm:px-8">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex gap-3">
            <CalendarDays size={18} className="mt-0.5 shrink-0 text-sage-200" aria-hidden="true" />
            <div><dt className="text-xs text-sage-200">{t('reportedOn')}</dt><dd className="mt-1 font-semibold">{formatReportedDate(record.arrival_date, locale)}</dd></div>
          </div>
          <div className="flex gap-3">
            <RefreshCw size={18} className="mt-0.5 shrink-0 text-sage-200" aria-hidden="true" />
            <div><dt className="text-xs text-sage-200">{t('fetchedAt')}</dt><dd className="mt-1 font-semibold">{formatFetchedAt(record.fetched_at, language)}</dd></div>
          </div>
          <div className="flex gap-3">
            <Landmark size={18} className="mt-0.5 shrink-0 text-sage-200" aria-hidden="true" />
            <div><dt className="text-xs text-sage-200">{t('source')}</dt><dd className="mt-1 font-semibold">{record.source}</dd></div>
          </div>
          <div>
            <dt className="text-xs text-sage-200">{t('variety')} / {t('grade')}</dt>
            <dd className="mt-1 font-semibold">{record.variety ?? '—'} / {record.grade ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

