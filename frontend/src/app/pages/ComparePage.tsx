import { useAppState } from '../app-state-context'
import { SectionReveal } from '../../components/ui/SectionReveal'
import { CompareSection } from '../../features/market-comparison/CompareSection'
import { NearbySection } from '../../features/market-comparison/NearbySection'
import { PriceSearchPanel } from '../../features/mandi-prices/PriceSearchPanel'
import { useMarketSearch } from '../../hooks/useMarketSearch'
import { translate } from '../../i18n/translations'

export function ComparePage() {
  const { language } = useAppState()
  const market = useMarketSearch()
  const canUseNearby = Boolean(market.selections.commodity && market.effectiveVariety && market.effectiveGrade)
  return (
    <div>
      <header className="mb-7 max-w-3xl">
        <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-[-0.035em] text-forest-950 sm:text-4xl">
          {translate(language, 'compareHeadline')}
        </h1>
        <p className="mt-3 text-base leading-7 text-ink-600">{translate(language, 'compareIntro')}</p>
      </header>
      <SectionReveal><PriceSearchPanel market={market} includeMarket compact /></SectionReveal>
      <div className="mt-6"><SectionReveal><CompareSection market={market} /></SectionReveal></div>
      {canUseNearby ? (
        <div className="mt-6">
          <SectionReveal>
            <NearbySection commodity={market.selections.commodity} variety={market.effectiveVariety} grade={market.effectiveGrade} />
          </SectionReveal>
        </div>
      ) : null}
    </div>
  )
}

