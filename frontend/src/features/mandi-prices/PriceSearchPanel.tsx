import { LocateFixed, SlidersHorizontal } from 'lucide-react'
import { useAppState } from '../../app/app-state-context'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import { translate } from '../../i18n/translations'
import type { useMarketSearch } from '../../hooks/useMarketSearch'

type MarketSearchState = ReturnType<typeof useMarketSearch>

interface PriceSearchPanelProps {
  market: MarketSearchState
  includeMarket?: boolean
  compact?: boolean
}

export function PriceSearchPanel({
  market,
  includeMarket = false,
  compact = false,
}: PriceSearchPanelProps) {
  const { language, setSelection, savedCrops } = useAppState()
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key)
  const selectionError =
    market.statesQuery.isError || market.commoditiesQuery.isError || market.districtsQuery.isError
  const catalogEmpty = market.statesQuery.isSuccess && market.commoditiesQuery.isSuccess
    && market.statesQuery.data.items.length === 0
    && market.commoditiesQuery.data.items.length === 0

  return (
    <section className={`rounded-3xl bg-sage-100 ${compact ? 'p-4 sm:p-5' : 'p-5 sm:p-7'}`} aria-labelledby="price-search-heading">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-900 text-white">
          <SlidersHorizontal size={19} aria-hidden="true" />
        </span>
        <div>
          <h2 id="price-search-heading" className="text-lg font-bold tracking-tight text-forest-950 sm:text-xl">
            {t('searchTitle')}
          </h2>
          {!compact ? <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-600">{t('searchHelp')}</p> : null}
        </div>
      </div>
      {selectionError ? (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {t('genericError')}
        </p>
      ) : null}
      {catalogEmpty ? (
        <div role="status" className="mb-5 rounded-xl border border-harvest-600/20 bg-paper p-4 text-sm leading-6 text-forest-950">
          {t('catalogNotReady')}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SearchableSelect
          label={t('state')}
          value={market.selections.state}
          options={market.statesQuery.data?.items ?? []}
          placeholder={t('chooseState')}
          searchLabel={t('searchOptions')}
          loadingLabel={t('loadingOptions')}
          emptyLabel={t('noOptions')}
          loading={market.statesQuery.isPending}
          onChange={(value) => setSelection('state', value)}
        />
        <SearchableSelect
          label={t('district')}
          value={market.selections.district}
          options={market.districtsQuery.data?.items ?? []}
          placeholder={t('chooseDistrict')}
          searchLabel={t('searchOptions')}
          loadingLabel={t('loadingOptions')}
          emptyLabel={t('noOptions')}
          loading={market.districtsQuery.isPending && Boolean(market.selections.state)}
          disabled={!market.selections.state}
          onChange={(value) => setSelection('district', value)}
        />
        <SearchableSelect
          label={t('commodity')}
          value={market.selections.commodity}
          options={market.commoditiesQuery.data?.items ?? []}
          placeholder={t('chooseCommodity')}
          searchLabel={t('searchOptions')}
          loadingLabel={t('loadingOptions')}
          emptyLabel={t('noOptions')}
          loading={market.commoditiesQuery.isPending}
          onChange={(value) => setSelection('commodity', value)}
        />
        <SearchableSelect
          label={t('variety')}
          value={market.selections.variety}
          options={market.varieties}
          placeholder={market.effectiveVariety || t('chooseVariety')}
          searchLabel={t('searchOptions')}
          loadingLabel={t('loadingOptions')}
          emptyLabel={t('noOptions')}
          loading={market.pricesQuery.isPending}
          disabled={!market.ready || market.varieties.length === 0}
          optional={t('optional')}
          onChange={(value) => setSelection('variety', value)}
        />
        <SearchableSelect
          label={t('grade')}
          value={market.selections.grade}
          options={market.grades}
          placeholder={market.effectiveGrade || t('chooseGrade')}
          searchLabel={t('searchOptions')}
          loadingLabel={t('loadingOptions')}
          emptyLabel={t('noOptions')}
          loading={market.pricesQuery.isPending}
          disabled={!market.ready || market.grades.length === 0}
          optional={t('optional')}
          onChange={(value) => setSelection('grade', value)}
        />
        {includeMarket ? (
          <SearchableSelect
            label={t('market')}
            value={market.selections.market}
            options={market.markets}
            placeholder={market.selectedRecord?.market ?? t('chooseMarket')}
            searchLabel={t('searchOptions')}
            loadingLabel={t('loadingOptions')}
            emptyLabel={t('noOptions')}
            loading={market.pricesQuery.isPending}
            disabled={!market.ready || market.markets.length === 0}
            onChange={(value) => setSelection('market', value)}
          />
        ) : null}
      </div>
      {savedCrops.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-ink-600">
            <LocateFixed size={16} aria-hidden="true" /> {t('savedCrops')}
          </span>
          {savedCrops.map((crop) => (
            <button
              key={crop}
              type="button"
              onClick={() => setSelection('commodity', crop)}
              className="min-h-10 rounded-lg bg-paper px-3 font-semibold text-forest-800 transition hover:bg-white focus-visible:outline-3 focus-visible:outline-harvest-500"
            >
              {crop}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

