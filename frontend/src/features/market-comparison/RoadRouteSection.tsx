import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { LocateFixed, MapPinned, Navigation, Route, Truck } from 'lucide-react'
import { useAppState } from '../../app/app-state-context'
import { Button } from '../../components/ui/Button'
import { FeedbackPanel } from '../../components/ui/FeedbackPanel'
import { translate } from '../../i18n/translations'
import { compareNetDeals } from '../../services/api'
import type { RoadCompareInput } from '../../types/mandi'
import { formatCurrency, formatReportedDate } from '../../utils/format'

interface RoadRouteProps {
  state: string
  commodity: string
  variety: string
  grade: string
}

export function RoadRouteSection({ state, commodity, variety, grade }: RoadRouteProps) {
  const { language } = useAppState()
  const t = (key: Parameters<typeof translate>[1], value?: Record<string, number | string>) =>
    translate(language, key, value)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [radius, setRadius] = useState('150')
  const [quantity, setQuantity] = useState('')
  const [ratePerKm, setRatePerKm] = useState('')
  const [fixedCost, setFixedCost] = useState('0')
  const [message, setMessage] = useState('')
  const [locating, setLocating] = useState(false)
  const mutation = useMutation({ mutationFn: compareNetDeals })

  const submit = (coords?: { latitude: number; longitude: number }) => {
    setMessage('')
    const lat = coords?.latitude ?? Number(latitude)
    const lon = coords?.longitude ?? Number(longitude)
    const range = Number(radius)
    const hasQuantity = quantity.trim().length > 0
    const hasRate = ratePerKm.trim().length > 0
    const q = Number(quantity)
    const rate = Number(ratePerKm)
    const extra = Number(fixedCost)
    if (
      (!coords && (!latitude.trim() || !longitude.trim()))
      || !Number.isFinite(lat) || lat < -90 || lat > 90
      || !Number.isFinite(lon) || lon < -180 || lon > 180
      || !Number.isFinite(range) || range <= 0 || range > 400
      || hasQuantity !== hasRate
      || (hasQuantity && (!Number.isFinite(q) || q <= 0))
      || (hasRate && (!Number.isFinite(rate) || rate < 0))
      || !Number.isFinite(extra) || extra < 0
      || (!hasQuantity && extra !== 0)
    ) {
      setMessage(t('roadInputWarning'))
      return
    }
    const payload: RoadCompareInput = {
      state, commodity, variety, grade, latitude: lat, longitude: lon,
      radius_km: range,
    }
    if (hasQuantity && hasRate) {
      payload.quantity_quintals = q
      payload.cost_per_km = rate
      payload.fixed_cost = extra
    }
    mutation.mutate(payload)
  }

  const locateAndCompare = () => {
    setMessage('')
    if (!navigator.geolocation) {
      setMessage(t('locationDenied'))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        const coords = position.coords
        setLatitude(coords.latitude.toFixed(6))
        setLongitude(coords.longitude.toFixed(6))
        submit({ latitude: coords.latitude, longitude: coords.longitude })
      },
      () => {
        setLocating(false)
        setMessage(t('locationDenied'))
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  }

  const busy = locating || mutation.isPending
  const data = mutation.data
  return (
    <section className="rounded-3xl bg-paper p-5 shadow-panel sm:p-7" aria-labelledby="road-title">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-harvest-100 text-harvest-600">
          <Route size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 id="road-title" className="text-xl font-bold text-forest-950">{t('roadTitle')}</h2>
          <p className="mt-1 text-sm leading-6 text-ink-600">{t('roadHelp')}</p>
        </div>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); submit() }} noValidate>
        <fieldset disabled={busy}>
          <legend className="mb-3 text-sm font-semibold text-forest-950">{t('roadLocation')}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-forest-950">
              {t('roadLat')}
              <input value={latitude} onChange={(e) => setLatitude(e.target.value)}
                type="number" step="any" min="-90" max="90" inputMode="decimal"
                className="mt-2 min-h-12 w-full rounded-xl bg-sage-50 px-3 outline outline-1 -outline-offset-1 outline-forest-900/15 focus:outline-3 focus:outline-harvest-500" />
            </label>
            <label className="text-sm font-medium text-forest-950">
              {t('roadLon')}
              <input value={longitude} onChange={(e) => setLongitude(e.target.value)}
                type="number" step="any" min="-180" max="180" inputMode="decimal"
                className="mt-2 min-h-12 w-full rounded-xl bg-sage-50 px-3 outline outline-1 -outline-offset-1 outline-forest-900/15 focus:outline-3 focus:outline-harvest-500" />
            </label>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ['roadRadius', radius, setRadius],
              ['roadQuantity', quantity, setQuantity],
              ['roadPerKm', ratePerKm, setRatePerKm],
              ['roadFixed', fixedCost, setFixedCost],
            ] as const).map(([label, value, setter]) => (
              <label key={label} className="text-sm font-medium text-forest-950">
                {t(label)}
                <input
                  value={value} onChange={(e) => setter(e.target.value)}
                  type="number" min="0" step="any" inputMode="decimal"
                  className="mt-2 min-h-12 w-full rounded-xl bg-sage-50 px-3 outline outline-1 -outline-offset-1 outline-forest-900/15 focus:outline-3 focus:outline-harvest-500"
                />
              </label>
            ))}
          </div>
        </fieldset>
        <p className="mt-3 text-xs leading-5 text-ink-600">{t('privacyNote')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" disabled={busy} onClick={locateAndCompare}>
            <LocateFixed size={18} aria-hidden="true" /> {t(busy ? 'roadLoading' : 'useLocation')}
          </Button>
          <Button type="submit" disabled={busy}>
            <Navigation size={18} aria-hidden="true" /> {t(busy ? 'roadLoading' : 'roadAction')}
          </Button>
        </div>
      </form>

      {message ? <p role="alert" className="mt-4 text-sm font-semibold text-red-800">{message}</p> : null}
      {mutation.isError ? (
        <div className="mt-5">
          <FeedbackPanel compact kind="error" title={t('roadError')}
            description={mutation.error.message} actionLabel={t('retry')} onAction={() => submit()} />
        </div>
      ) : null}
      {data?.status === 'coordinates_unavailable' ? (
        <div className="mt-5"><FeedbackPanel compact title={t('roadUnavailable')} /></div>
      ) : null}
      {data?.status === 'no_matching_verified_markets' ? (
        <div className="mt-5"><FeedbackPanel compact title={t('roadNoMarkets')} /></div>
      ) : null}
      {data?.status === 'input_required' || data?.status === 'insufficient_fresh_data' ? (
        <div className="mt-5"><FeedbackPanel compact title={data.message} /></div>
      ) : null}
      {data?.best_market ? <p className="mt-5 rounded-xl bg-sage-100 p-4 text-sm font-bold text-forest-950">
        {language === 'hi' ? 'अनुमानित शुद्ध कमाई के अनुसार सर्वोत्तम' : 'Highest eligible estimated net'}: {data.best_market}
      </p> : null}
      {data && ['ok', 'input_required', 'insufficient_fresh_data'].includes(data.status) ? (
        <div className="mt-6" aria-live="polite">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-forest-800">
            <Truck size={18} aria-hidden="true" /> {t('roadDistance')} · OpenRouteService
          </div>
          <div className="grid gap-3">
            {data.markets.map((market) => (
              <article
                key={`${market.observation.state}-${market.observation.district}-${market.observation.market}-${market.observation.arrival_date}`}
                className="rounded-2xl bg-sage-50 p-4 sm:p-5"
              >
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <h3 className="inline-flex items-center gap-2 text-base font-bold text-forest-950">
                      <MapPinned size={17} aria-hidden="true" /> {market.observation.market}
                    </h3>
                    <p className="mt-1 text-xs text-ink-600">
                      {market.observation.district} · {formatReportedDate(
                        market.observation.arrival_date, language === 'hi' ? 'hi-IN' : 'en-IN'
                      )}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-forest-800">
                      {formatCurrency(market.observation.modal_price, language)} / {t('perQuintal')}
                    </p>
                  </div>
                  <div className="text-right">
                    {market.route_status === 'available' ? (
                      <>
                        <p className="tabular-nums text-lg font-extrabold text-forest-950">
                          {market.distance_km?.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')} km
                        </p>
                        <p className="text-xs text-ink-600">
                          {market.duration_minutes?.toFixed(0)} {t('roadMinutes')}
                        </p>
                      </>
                    ) : <p className="text-sm text-red-800">{t('roadUnreachable')}</p>}
                  </div>
                </div>
                {!market.eligible ? <p className="mt-3 text-xs font-medium text-harvest-600">
                  {language === 'hi' ? 'तुलना की रैंकिंग में शामिल नहीं' : 'Excluded from best-deal ranking'}: {market.exclusion_reason}
                </p> : null}
                {market.estimate ? (
                  <dl className="mt-4 grid gap-3 border-t border-forest-900/10 pt-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-ink-600">{t('roadCost')}</dt>
                      <dd className="tabular-nums font-semibold text-forest-950">
                        {formatCurrency(market.estimate.transport_cost, language)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink-600">{t('roadNet')}</dt>
                      <dd className="tabular-nums text-lg font-extrabold text-forest-900">
                        {formatCurrency(market.estimate.net_proceeds, language)}
                      </dd>
                    </div>
                  </dl>
                ) : null}
              </article>
            ))}
          </div>
          {data.excluded_without_coordinates > 0 ? (
            <p className="mt-4 text-sm text-ink-600">
              {t('roadExcluded', { count: data.excluded_without_coordinates })}
            </p>
          ) : null}
          <p className="mt-4 text-xs leading-5 text-ink-600">{t('roadDisclaimer')}</p>
        </div>
      ) : null}
    </section>
  )
}
