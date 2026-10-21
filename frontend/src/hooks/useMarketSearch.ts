import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppState } from '../app/app-state-context'
import { getCommodities, getDistricts, getPrices, getStates } from '../services/api'
import { uniqueValues } from '../utils/format'

export function useMarketSearch() {
  const { selections, rememberVerifiedReportDate } = useAppState()
  const statesQuery = useQuery({
    queryKey: ['states'],
    queryFn: getStates,
    staleTime: 10 * 60_000,
  })
  const commoditiesQuery = useQuery({
    queryKey: ['commodities'],
    queryFn: getCommodities,
    staleTime: 10 * 60_000,
  })
  const districtsQuery = useQuery({
    queryKey: ['districts', selections.state],
    queryFn: () => getDistricts(selections.state),
    enabled: Boolean(selections.state),
    staleTime: 10 * 60_000,
  })
  const ready = Boolean(selections.state && selections.district && selections.commodity)
  const pricesQuery = useQuery({
    queryKey: ['prices', selections.state, selections.district, selections.commodity],
    queryFn: () =>
      getPrices({
        state: selections.state,
        district: selections.district,
        commodity: selections.commodity,
      }),
    enabled: ready,
    staleTime: 5 * 60_000,
  })

  useEffect(() => {
    if (pricesQuery.data?.verified) {
      rememberVerifiedReportDate(pricesQuery.data.latest_report_date)
    }
  }, [pricesQuery.data, rememberVerifiedReportDate])

  const derived = useMemo(() => {
    const records = pricesQuery.data?.records ?? []
    const varieties = uniqueValues(records.map((record) => record.variety))
    const effectiveVariety = selections.variety || (varieties.length === 1 ? varieties[0] : '')
    const recordsForVariety = effectiveVariety
      ? records.filter((record) => record.variety === effectiveVariety)
      : records
    const grades = uniqueValues(recordsForVariety.map((record) => record.grade))
    const effectiveGrade = selections.grade || (grades.length === 1 ? grades[0] : '')
    const comparableRecords = recordsForVariety.filter((record) =>
      effectiveGrade ? record.grade === effectiveGrade : true,
    )
    const markets = uniqueValues(comparableRecords.map((record) => record.market))
    const selectedRecord = comparableRecords.find((record) =>
      selections.market ? record.market === selections.market : true,
    )
    return {
      records,
      varieties,
      effectiveVariety,
      grades,
      effectiveGrade,
      markets,
      selectedRecord: selectedRecord ?? null,
      requiresVariety: varieties.length > 1 && !selections.variety,
      requiresGrade: grades.length > 1 && !selections.grade,
    }
  }, [pricesQuery.data?.records, selections.grade, selections.market, selections.variety])

  return {
    ready,
    selections,
    statesQuery,
    districtsQuery,
    commoditiesQuery,
    pricesQuery,
    ...derived,
  }
}

