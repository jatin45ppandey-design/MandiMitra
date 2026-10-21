import { DatabaseZap } from 'lucide-react'
import { useAppState } from '../app-state-context'
import { BackendStatus } from '../../components/common/BackendStatus'
import { SectionReveal } from '../../components/ui/SectionReveal'
import { LatestPriceCard } from '../../features/mandi-prices/LatestPriceCard'
import { DataCoveragePanel } from '../../features/mandi-prices/DataCoveragePanel'
import { PriceSearchPanel } from '../../features/mandi-prices/PriceSearchPanel'
import { TrendSection } from '../../features/price-trends/TrendSection'
import { TransportSection } from '../../features/transport-calculator/TransportSection'
import { useMarketSearch } from '../../hooks/useMarketSearch'
import { translate } from '../../i18n/translations'
import { recordIdentity } from '../../utils/format'

export function HomePage() {
  const { language } = useAppState()
  const market = useMarketSearch()
  return (
    <div>
      <header className="mb-7 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-forest-700">
            <DatabaseZap size={17} aria-hidden="true" /> {translate(language, 'homeKicker')}
          </p>
          <h1 className="text-balance mt-3 text-3xl font-extrabold leading-tight tracking-[-0.035em] text-forest-950 sm:text-5xl">
            {translate(language, 'homeHeadline')}
          </h1>
          <p className="text-pretty mt-4 max-w-2xl text-base leading-7 text-ink-600 sm:text-lg">
            {translate(language, 'homeIntro')}
          </p>
        </div>
        <div className="md:hidden"><BackendStatus /></div>
      </header>
      <DataCoveragePanel />
      <SectionReveal><PriceSearchPanel market={market} /></SectionReveal>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionReveal><LatestPriceCard market={market} /></SectionReveal>
        <SectionReveal><TrendSection market={market} /></SectionReveal>
      </div>
      <div className="mt-6">
        <SectionReveal>
          <TransportSection
            key={market.selectedRecord ? recordIdentity(market.selectedRecord) : 'empty-transport'}
            record={market.selectedRecord}
            verified={Boolean(market.pricesQuery.data?.verified)}
          />
        </SectionReveal>
      </div>
    </div>
  )
}

