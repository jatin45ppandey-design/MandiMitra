export interface MandiPrice {
  state: string
  district: string
  market: string
  commodity: string
  variety: string | null
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
}

export interface MandiSnapshot {
  metadata: SnapshotMetadata
  records: MandiPrice[]
}

