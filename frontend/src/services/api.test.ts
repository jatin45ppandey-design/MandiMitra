import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildQuery, estimateTransport, getAlerts, getPrices } from './api'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function stubBrowserTimers() {
  vi.stubGlobal('window', {
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  })
}

describe('API contract client', () => {
  it('encodes query parameters and omits empty values', () => {
    expect(buildQuery({ state: 'Uttar Pradesh', grade: '', page: 2 })).toBe(
      '?state=Uttar+Pradesh&page=2',
    )
  })

  it('requests the backend price contract without inventing records', async () => {
    stubBrowserTimers()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ records: [], count: 0, verified: false, latest_report_date: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getPrices({
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      commodity: 'Wheat',
    })

    expect(result.records).toEqual([])
    expect(result.verified).toBe(false)
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/prices?state=Uttar+Pradesh&district=Lucknow&commodity=Wheat',
    )
  })

  it('attaches bearer tokens only to account requests', async () => {
    stubBrowserTimers()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await getAlerts('session-token')

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer session-token')
  })

  it('normalizes backend Decimal strings before calculations are displayed', async () => {
    stubBrowserTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            gross_estimate: '25000',
            total_costs: '1600',
            net_estimate: '23400',
            disclaimer: 'Estimate only',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const result = await estimateTransport({
      rate_per_quintal: 2500,
      quantity_quintals: 10,
      transport_cost: 1000,
      loading_cost: 500,
      market_fees: 100,
      other_costs: 0,
    })

    expect(result.net_estimate).toBe(23400)
    expect(typeof result.net_estimate).toBe('number')
  })
})

