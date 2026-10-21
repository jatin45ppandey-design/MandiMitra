import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import {
  AppStateContext,
  emptySelections,
  type MarketSelections,
  type SelectionField,
} from './app-state-context'
import type { Language } from '../types/mandi'

const storageKey = 'mandimitra.preferences.v1'

interface StoredState {
  version: 1
  language: Language
  selections: MarketSelections
  savedCrops: string[]
  lastVerifiedReportDate: string | null
}

const defaultState: StoredState = {
  version: 1,
  language: 'hi',
  selections: emptySelections,
  savedCrops: [],
  lastVerifiedReportDate: null,
}

function readStoredState(): StoredState {
  try {
    const raw = window.localStorage.getItem(storageKey)
    let parsed: Partial<StoredState> = defaultState
    if (raw) {
      const candidate = JSON.parse(raw) as Partial<StoredState>
      if (
        candidate.version === 1 &&
        (candidate.language === 'hi' || candidate.language === 'en')
      ) {
        parsed = candidate
      }
    }
    const selections = { ...emptySelections, ...(parsed.selections ?? {}) }
    const search = new URLSearchParams(window.location.search)
    ;(Object.keys(emptySelections) as Array<keyof MarketSelections>).forEach((field) => {
      const fromUrl = search.get(field)
      if (fromUrl) selections[field] = fromUrl
    })
    return {
      version: 1,
      language: parsed.language === 'en' ? 'en' : 'hi',
      selections,
      savedCrops: Array.isArray(parsed.savedCrops)
        ? parsed.savedCrops.filter((item): item is string => typeof item === 'string')
        : [],
      lastVerifiedReportDate:
        typeof parsed.lastVerifiedReportDate === 'string'
          ? parsed.lastVerifiedReportDate
          : null,
    }
  } catch {
    return defaultState
  }
}

export function AppStateProvider({ children }: PropsWithChildren) {
  const [stored, setStored] = useState<StoredState>(readStoredState)

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(stored))
    document.documentElement.lang = stored.language
    const url = new URL(window.location.href)
    ;(Object.keys(stored.selections) as Array<keyof MarketSelections>).forEach((field) => {
      const value = stored.selections[field]
      if (value) url.searchParams.set(field, value)
      else url.searchParams.delete(field)
    })
    window.history.replaceState(window.history.state, '', url)
  }, [stored])

  const setLanguage = useCallback((language: Language) => {
    setStored((current) => ({ ...current, language }))
  }, [])

  const setSelection = useCallback((field: SelectionField, value: string) => {
    setStored((current) => {
      const next = { ...current.selections, [field]: value }
      if (field === 'state') {
        Object.assign(next, { district: '', variety: '', grade: '', market: '' })
      } else if (field === 'district' || field === 'commodity') {
        Object.assign(next, { variety: '', grade: '', market: '' })
      } else if (field === 'variety') {
        Object.assign(next, { grade: '', market: '' })
      } else if (field === 'grade') {
        next.market = ''
      }
      return { ...current, selections: next }
    })
  }, [])

  const applyCloudPreferences = useCallback((prefs: {
    language:Language; default_state:string|null; default_district:string|null; default_commodity:string|null
  }) => {
    setStored(current => {
      // Preserve a local choice in progress; use cloud defaults only on an empty device.
      if (current.selections.state || current.selections.district || current.selections.commodity) return current
      return {...current, language:prefs.language,
        selections:{...current.selections,state:prefs.default_state??'',
          district:prefs.default_district??'',commodity:prefs.default_commodity??''}}
    })
  }, [])

  const toggleSavedCrop = useCallback((commodity: string) => {
    if (!commodity) return
    setStored((current) => ({
      ...current,
      savedCrops: current.savedCrops.includes(commodity)
        ? current.savedCrops.filter((item) => item !== commodity)
        : [...current.savedCrops, commodity].toSorted((a, b) => a.localeCompare(b)),
    }))
  }, [])

  const clearLocalPreferences = useCallback(() => {
    setStored((current) => ({
      ...current,
      selections: emptySelections,
      savedCrops: [],
    }))
  }, [])

  const rememberVerifiedReportDate = useCallback((date: string | null) => {
    if (!date) return
    setStored((current) => {
      if (current.lastVerifiedReportDate === date) return current
      if (
        current.lastVerifiedReportDate &&
        current.lastVerifiedReportDate.localeCompare(date) >= 0
      ) {
        return current
      }
      return { ...current, lastVerifiedReportDate: date }
    })
  }, [])

  const value = useMemo(
    () => ({
      language: stored.language,
      setLanguage,
      applyCloudPreferences,
      selections: stored.selections,
      setSelection,
      savedCrops: stored.savedCrops,
      toggleSavedCrop,
      clearLocalPreferences,
      lastVerifiedReportDate: stored.lastVerifiedReportDate,
      rememberVerifiedReportDate,
    }),
    [
      clearLocalPreferences,
      rememberVerifiedReportDate,
      setLanguage,
      applyCloudPreferences,
      setSelection,
      stored,
      toggleSavedCrop,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

