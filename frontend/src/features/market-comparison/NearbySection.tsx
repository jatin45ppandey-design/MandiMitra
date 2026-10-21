import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { LocateFixed, MapPin } from 'lucide-react'
import { useAppState } from '../../app/app-state-context'
import { Button } from '../../components/ui/Button'
import { FeedbackPanel } from '../../components/ui/FeedbackPanel'
import { translate } from '../../i18n/translations'
import { getNearbyMarkets } from '../../services/api'
import type { MarketPrice } from '../../types/mandi'
import { formatCurrency, formatReportedDate } from '../../utils/format'

interface NearbySectionProps {
  commodity: string
  variety: string
  grade: string
}

export function NearbySection({ commodity, variety, grade }: NearbySectionProps) {
  const { language } = useAppState()
  const [locationError, setLocationError] = useState('')
  const [locating, setLocating] = useState(false)
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key)
  const mutation = useMutation({
    mutationFn: ({ latitude, longitude }: { latitude: number; longitude: number }) =>
      getNearbyMarkets({ commodity, variety, grade, latitude, longitude, radius_km: 100 }),
  })

  const requestLocation = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError(t('locationDenied'))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        mutation.mutate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        setLocating(false)
        setLocationError(t('locationDenied'))
      },
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 5 * 60_000 },
    )
  }

  const data = mutation.data
  return (
    <section className="rounded-3xl bg-sage-100 p-5 sm:p-7" aria-labelledby="nearby-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-2xl items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-900 text-white">
            <LocateFixed size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 id="nearby-heading" className="text-xl font-bold tracking-tight text-forest-950">{t('nearbyTitle')}</h2>
            <p className="mt-1 text-sm leading-6 text-ink-600">{t('nearbyHelp')}</p>
          </div>
        </div>
        <Button type="button" onClick={requestLocation} disabled={locating || mutation.isPending}>
          <MapPin size={18} aria-hidden="true" />
          {t(locating || mutation.isPending ? 'locating' : 'useLocation')}
        </Button>
      </div>
      <p className="mt-3 text-xs text-ink-600">{t('privacyNote')}</p>
      {locationError ? <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{locationError}</p> : null}
      {mutation.isError ? <FeedbackPanel compact kind="error" title={t('genericError')} /> : null}
      {data?.status === 'coordinates_unavailable' ? (
        <div className="mt-5"><FeedbackPanel compact title={t('coordinatesUnavailable')} /></div>
      ) : null}
      {data?.status === 'no_matching_verified_markets' ? (
        <div className="mt-5"><FeedbackPanel compact title={t('noNearbyMarkets')} /></div>
      ) : null}
      {data?.status === 'ok' ? (
        <div className="mt-5 grid gap-3">
          {data.markets.map(({ distance_km, observation }: { distance_km: number; observation: MarketPrice }) => (
            <article key={`${observation.market}-${observation.arrival_date}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-paper p-4">
              <div>
                <h3 className="font-bold text-forest-950">{observation.market}</h3>
                <p className="mt-1 text-xs text-ink-600">{formatReportedDate(observation.arrival_date, language === 'hi' ? 'hi-IN' : 'en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="tabular-nums font-bold text-forest-950">{formatCurrency(observation.modal_price, language)}</p>
                <p className="mt-1 text-xs text-ink-600">{distance_km} km · {t('straightLine')}</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

