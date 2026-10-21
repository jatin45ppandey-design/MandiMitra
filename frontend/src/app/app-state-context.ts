import { createContext, useContext } from 'react'
import type { Language } from '../types/mandi'

export interface MarketSelections {
  state: string
  district: string
  commodity: string
  variety: string
  grade: string
  market: string
}

export type SelectionField = keyof MarketSelections

export interface AppStateValue {
  language: Language
  setLanguage: (language: Language) => void
  applyCloudPreferences: (input: {language:Language; default_state:string|null; default_district:string|null; default_commodity:string|null}) => void
  selections: MarketSelections
  setSelection: (field: SelectionField, value: string) => void
  savedCrops: string[]
  toggleSavedCrop: (commodity: string) => void
  clearLocalPreferences: () => void
  lastVerifiedReportDate: string | null
  rememberVerifiedReportDate: (date: string | null) => void
}

export const emptySelections: MarketSelections = {
  state: '',
  district: '',
  commodity: '',
  variety: '',
  grade: '',
  market: '',
}

export const AppStateContext = createContext<AppStateValue | null>(null)

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext)
  if (!value) throw new Error('useAppState must be used inside AppStateProvider')
  return value
}

