import type { MandiSnapshot, MarketPrice } from '../types/mandi'

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value))
}

function isMarketPrice(value: unknown): value is MarketPrice {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<MarketPrice>
  return (
    typeof record.state === 'string' &&
    typeof record.district === 'string' &&
    typeof record.market === 'string' &&
    typeof record.commodity === 'string' &&
    typeof record.arrival_date === 'string' &&
    isNullableNumber(record.min_price) &&
    isNullableNumber(record.max_price) &&
    isNullableNumber(record.modal_price) &&
    record.price_unit === 'INR/quintal' &&
    typeof record.source === 'string'
  )
}

export async function readBundledSnapshot(): Promise<MandiSnapshot> {
  const response = await fetch('/data/mandi-snapshot.json')
  if (!response.ok) throw new Error('No local mandi snapshot available')
  const snapshot: unknown = await response.json()
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('Invalid mandi snapshot schema')
  }
  const candidate = snapshot as Partial<MandiSnapshot>
  if (
    !candidate.metadata ||
    typeof candidate.metadata.source !== 'string' ||
    typeof candidate.metadata.record_count !== 'number' ||
    typeof candidate.metadata.verified !== 'boolean' ||
    !Array.isArray(candidate.records) ||
    !candidate.records.every(isMarketPrice)
  ) {
    throw new Error('Invalid mandi snapshot schema')
  }
  return candidate as MandiSnapshot
}

