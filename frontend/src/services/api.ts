import { readBundledSnapshot } from './offline-data'
import type {
  ListingResponse,
  MarketPrice,
  NearbyResponse,
  NotificationResponse,
  PreferenceUpdate,
  PriceAlert,
  PriceAlertInput,
  PriceResponse,
  TransportInput,
  TransportResult,
  TrendResponse,
} from '../types/mandi'

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(
  /\/$/,
  '',
)

export interface HealthResponse {
  status: string
  service: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type QueryValue = string | number | undefined | null

export function buildQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  })
  const serialized = search.toString()
  return serialized ? `?${serialized}` : ''
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback
  const detail = (payload as { detail?: unknown }).detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: unknown }
    if (typeof first?.msg === 'string') return first.msg
  }
  return fallback
}

function numericField(value: unknown, field: string): number {
  const normalized = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(normalized)) {
    throw new ApiError(`The API returned an invalid ${field}.`, 502)
  }
  return normalized
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8_000)
  const externalSignal = options.signal
  const abortFromExternal = () => controller.abort()
  externalSignal?.addEventListener('abort', abortFromExternal, { once: true })

  try {
    const headers = new Headers(options.headers)
    if (options.body) headers.set('Content-Type', 'application/json')
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })
    if (response.status === 204) return undefined as T
    const payload: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      throw new ApiError(
        getErrorMessage(payload, `Request failed with status ${response.status}`),
        response.status,
      )
    }
    return payload as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Please retry.')
    }
    throw new ApiError('Could not reach the MandiMitra API.')
  } finally {
    window.clearTimeout(timeout)
    externalSignal?.removeEventListener('abort', abortFromExternal)
  }
}

function filterSnapshotRecords(
  records: MarketPrice[],
  filters: Record<string, string | undefined>,
): MarketPrice[] {
  return records
    .filter((record) =>
      Object.entries(filters).every(([key, expected]) => {
        if (!expected) return true
        const actual = record[key as keyof MarketPrice]
        return String(actual ?? '').toLocaleLowerCase() === expected.toLocaleLowerCase()
      }),
    )
    .toSorted((a, b) => b.arrival_date.localeCompare(a.arrival_date))
}

async function listingWithFallback(
  path: string,
  field: 'state' | 'district' | 'commodity',
  state?: string,
): Promise<ListingResponse> {
  try {
    return { ...(await request<ListingResponse>(path)), origin: 'api' }
  } catch (error) {
    if (error instanceof ApiError && error.status !== 0) throw error
    const snapshot = await readBundledSnapshot()
    const records = state
      ? snapshot.records.filter(
          (record) => record.state.toLocaleLowerCase() === state.toLocaleLowerCase(),
        )
      : snapshot.records
    return {
      items: [...new Set(records.map((record) => record[field]))].sort((a, b) =>
        a.localeCompare(b),
      ),
      origin: 'bundled-snapshot',
    }
  }
}

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>('/health', { signal })
}

export function getStates(): Promise<ListingResponse> {
  return listingWithFallback('/states', 'state')
}

export function getDistricts(state: string): Promise<ListingResponse> {
  return listingWithFallback(`/districts${buildQuery({ state })}`, 'district', state)
}

export function getCommodities(): Promise<ListingResponse> {
  return listingWithFallback('/commodities', 'commodity')
}

export async function getPrices(filters: {
  state: string
  district: string
  commodity: string
  variety?: string
  market?: string
}): Promise<PriceResponse> {
  try {
    const response = await request<PriceResponse>(`/prices${buildQuery(filters)}`)
    return { ...response, origin: 'api' }
  } catch (error) {
    if (error instanceof ApiError && error.status !== 0) throw error
    const snapshot = await readBundledSnapshot()
    const records = filterSnapshotRecords(snapshot.records, filters)
    return {
      records,
      count: records.length,
      verified: snapshot.metadata.verified,
      latest_report_date: records[0]?.arrival_date ?? null,
      fetched_at: snapshot.metadata.fetched_at,
      origin: 'bundled-snapshot',
    }
  }
}

export async function getTrends(params: {
  commodity: string
  state: string
  district: string
  market: string
  variety?: string
}): Promise<TrendResponse> {
  const response = await request<Omit<TrendResponse, 'observations'> & {
    observations: Array<Omit<TrendResponse['observations'][number], 'modal_price'> & { modal_price: number | string }>
  }>(`/trends${buildQuery(params)}`)
  return {
    ...response,
    observations: response.observations.map((item) => ({
      ...item,
      modal_price: numericField(item.modal_price, 'trend modal price'),
    })),
  }
}

export function compareMarkets(params: {
  commodity: string
  state: string
  district: string
  variety: string
  grade: string
}): Promise<PriceResponse> {
  return request<PriceResponse>(`/markets/compare${buildQuery(params)}`)
}

export function getNearbyMarkets(params: {
  commodity: string
  variety: string
  grade: string
  latitude: number
  longitude: number
  radius_km?: number
}): Promise<NearbyResponse> {
  return request<NearbyResponse>(`/markets/nearby${buildQuery(params)}`)
}

export async function estimateTransport(input: TransportInput): Promise<TransportResult> {
  const response = await request<{
    gross_estimate: number | string
    total_costs: number | string
    net_estimate: number | string
    disclaimer: string
  }>('/transport/estimate', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return {
    ...response,
    gross_estimate: numericField(response.gross_estimate, 'gross estimate'),
    total_costs: numericField(response.total_costs, 'total costs'),
    net_estimate: numericField(response.net_estimate, 'net estimate'),
  }
}

export async function getAlerts(token: string): Promise<PriceAlert[]> {
  const response = await request<Array<Omit<PriceAlert, 'threshold'> & { threshold: number | string }>>(
    '/alerts',
    {},
    token,
  )
  return response.map((alert) => ({
    ...alert,
    threshold: numericField(alert.threshold, 'alert threshold'),
  }))
}

export async function createAlert(input: PriceAlertInput, token: string): Promise<PriceAlert> {
  const response = await request<Omit<PriceAlert, 'threshold'> & { threshold: number | string }>(
    '/alerts',
    { method: 'POST', body: JSON.stringify(input) },
    token,
  )
  return { ...response, threshold: numericField(response.threshold, 'alert threshold') }
}

export function disableAlert(alertId: string, token: string): Promise<void> {
  return request<void>(`/alerts/${encodeURIComponent(alertId)}`, { method: 'DELETE' }, token)
}

export function savePreferences(
  input: PreferenceUpdate,
  token: string,
): Promise<PreferenceUpdate> {
  return request<PreferenceUpdate>(
    '/preferences',
    { method: 'PUT', body: JSON.stringify(input) },
    token,
  )
}

export function getNotifications(token: string): Promise<NotificationResponse> {
  return request<NotificationResponse>('/notifications', {}, token)
}

export const apiBaseUrl = baseUrl

