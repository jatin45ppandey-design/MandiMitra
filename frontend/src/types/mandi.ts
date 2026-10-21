export type Language = 'hi' | 'en'

export interface MarketPrice {
  state: string
  district: string
  market: string
  commodity: string
  variety: string | null
  grade: string | null
  arrival_date: string
  min_price: number | null
  max_price: number | null
  modal_price: number | null
  price_unit: 'INR/quintal'
  source: string
  fetched_at: string | null
}

export interface SnapshotMetadata {
  source: string
  fetched_at: string | null
  latest_report_date: string | null
  record_count: number
  verified: boolean
  partial?: boolean
  filters?: Record<string, string>
  rejected_records?: number
}

export interface MandiSnapshot {
  metadata: SnapshotMetadata
  records: MarketPrice[]
}

export interface ListingResponse {
  items: string[]
  origin?: 'api' | 'bundled-snapshot'
}

export interface PriceResponse {
  records: MarketPrice[]
  count: number
  verified: boolean
  latest_report_date: string | null
  origin?: 'api' | 'bundled-snapshot'
  fetched_at?: string | null
}

export interface TrendObservation {
  report_date: string
  modal_price: number
  market: string
  variety: string | null
}

export interface TrendResponse {
  observations: TrendObservation[]
  verified: boolean
  message: string | null
}

export interface NearbyMarket {
  distance_km: number
  observation: MarketPrice
}

export interface NearbyResponse {
  status: 'ok' | 'coordinates_unavailable' | 'no_matching_verified_markets'
  distance_type: 'straight_line'
  markets: NearbyMarket[]
  message?: string
}

export interface TransportInput {
  rate_per_quintal: number
  quantity_quintals: number
  transport_cost: number
  loading_cost: number
  market_fees: number
  other_costs: number
}

export interface TransportResult {
  gross_estimate: number
  total_costs: number
  net_estimate: number
  disclaimer: string
}

export interface PriceAlertInput {
  state: string
  district: string
  market: string
  commodity: string
  variety: string
  grade: string
  threshold: number
  direction: 'above' | 'below'
  channel: 'in_app'
}

export interface PriceAlert extends PriceAlertInput {
  id: string
  enabled: boolean
}

export interface PreferenceUpdate {
  language: Language
  default_state: string | null
  default_district: string | null
  default_commodity: string | null
}

export interface NotificationEvent {
  id: string
  observation_identity: string
  channel: string
  status: string
  created_at: string
}

export interface NotificationResponse {
  items: NotificationEvent[]
}

