import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildQuery, compareRoadRoutes, estimateTransport, getAlerts, getDataCoverage, getPrices } from './api'

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


describe('road routing and real-data coverage', () => {
  it('passes market selections to the backend and converts Decimal results', async () => {
    stubBrowserTimers()
    const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 'ok',
      source: 'OpenRouteService',
      distance_type: 'road_route',
      latest_report_date: '2026-10-20',
      excluded_without_coordinates: 0,
      message: 'test response',
      disclaimer: 'estimates only',
      markets: [{
        observation: {
          state: 'Test State', district: 'Test District', market: 'Test Market',
          commodity: 'Wheat', variety: 'Dara', grade: 'FAQ',
          arrival_date: '2026-10-20', modal_price: 2500,
        },
        distance_km: 42.5,
        duration_minutes: 65,
        route_status: 'available',
        estimate: {
          gross_proceeds: '25000', transport_cost: '925',
          net_proceeds: '24075', currency: 'INR', estimated: true,
        },
      }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', mock)
    const response = await compareRoadRoutes({
      state: 'Test State', commodity: 'Wheat', variety: 'Dara', grade: 'FAQ',
      latitude: 20, longitude: 80, radius_km: 150,
      quantity_quintals: 10, cost_per_km: 10, fixed_cost: 500,
    })
    const request = mock.mock.calls[0] as [string, RequestInit]
    expect(request[0]).toContain('/markets/road-compare')
    expect(JSON.parse(request[1].body as string).quantity_quintals).toBe(10)
    expect(response.markets[0].estimate?.net_proceeds).toBe(24075)
  })

  it('does not invent road distances when coordinates are unavailable', async () => {
    stubBrowserTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 'coordinates_unavailable', source: 'OpenRouteService',
      distance_type: 'road_route', markets: [],
      latest_report_date: null, excluded_without_coordinates: 0,
      message: 'No registry', disclaimer: 'Estimates only',
    }), { status: 200 })))
    const response = await compareRoadRoutes({
      state: 'Test State', commodity: 'Wheat', variety: 'Dara', grade: 'FAQ',
      latitude: 20, longitude: 80,
    })
    expect(response.status).toBe('coordinates_unavailable')
    expect(response.markets).toEqual([])
  })

  it('retrieves data coverage instead of assuming healthy API means data exists', async () => {
    stubBrowserTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      verified: false, record_count: 0, latest_report_date: null,
      verified_market_coordinates: 0, source: 'AGMARKNET',
      note: 'No verified data',
    }), { status: 200 })))
    const coverage = await getDataCoverage()
    expect(coverage.verified).toBe(false)
    expect(coverage.record_count).toBe(0)
  })
})
