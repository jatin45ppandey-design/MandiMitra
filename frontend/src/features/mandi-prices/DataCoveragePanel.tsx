import { useQuery } from '@tanstack/react-query'
import { DatabaseZap, ExternalLink, MapPinned, RefreshCw } from 'lucide-react'
import { useAppState } from '../../app/app-state-context'
import { translate } from '../../i18n/translations'
import { getDataCoverage } from '../../services/api'
import { formatReportedDate } from '../../utils/format'

export function DataCoveragePanel() {
  const { language, selections } = useAppState()
  const t = (key: Parameters<typeof translate>[1], value?: Record<string, number | string>) =>
    translate(language, key, value)
  const status = useQuery({
    queryKey: ['public-data-coverage', selections.state, selections.district, selections.commodity],
    queryFn: () => getDataCoverage({state:selections.state, district:selections.district, commodity:selections.commodity}),
    staleTime: 10 * 60_000,
    retry: 1,
  })
  const count = status.data?.record_count ?? 0
  const fresh = Boolean(status.data?.verified && count)
  return (
    <section
      className="mb-6 flex flex-col gap-4 rounded-2xl border border-forest-900/10 bg-paper p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
      aria-label={t('coverageTitle')}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sage-100 text-forest-900">
          <DatabaseZap size={20} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold text-forest-950">{t('coverageTitle')}</p>
          {status.isPending ? (
            <p className="mt-1 text-sm text-ink-600">{t('backendChecking')}</p>
          ) : status.isError ? (
            <p className="mt-1 text-sm text-ink-600">{t('coverageOffline')}</p>
          ) : (
            <>
              <p className="mt-1 text-sm leading-6 text-ink-600">
                {fresh
                  ? t('coverageCount', { count: count.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN') })
                  : t('coverageMissing')}
              </p>
              {fresh && status.data?.latest_report_date ? (
                <p className="mt-1 text-xs font-semibold text-forest-800">
                  {t('coverageLatest', {
                    date: formatReportedDate(
                      status.data.latest_report_date,
                      language === 'hi' ? 'hi-IN' : 'en-IN',
                    ),
                  })}
                </p>
              ) : null}
              {fresh && status.data?.age_days !== null && status.data?.age_days !== undefined ? (
                <p className={`mt-1 text-xs font-semibold ${status.data.age_days > 3 ? 'text-harvest-600' : 'text-forest-800'}`}>
                  {status.data.age_days > 3
                    ? (language === 'hi' ? `यह रिकॉर्ड ${status.data.age_days} दिन पुराना है; इसे आज का भाव न मानें।`
                        : `Latest report is ${status.data.age_days} days old; not today's rate.`)
                    : (language === 'hi' ? `उपलब्ध रिपोर्ट: ${status.data.reporting_days ?? 0} दिन, ${status.data.market_count ?? 0} मंडियाँ`
                        : `${status.data.reporting_days ?? 0} reported days, ${status.data.market_count ?? 0} mandis`)}
                </p>
              ) : null}
              {status.data && status.data.verified_market_coordinates > 0 ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-600">
                  <MapPinned size={13} aria-hidden="true" />
                  {t('coverageCoordinates', {
                    count: status.data.verified_market_coordinates,
                  })}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
        <a
          href="https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sage-100 px-3 text-sm font-semibold text-forest-900 hover:bg-sage-200 focus-visible:outline-3 focus-visible:outline-harvest-500"
        >
          {t('coverageSource')} <ExternalLink size={15} aria-hidden="true" />
        </a>
        <button
          type="button" aria-label={t('retry')} title={t('retry')}
          onClick={() => void status.refetch()}
          className="grid size-11 place-items-center rounded-xl text-forest-800 hover:bg-sage-100 focus-visible:outline-3 focus-visible:outline-harvest-500"
        >
          <RefreshCw size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
