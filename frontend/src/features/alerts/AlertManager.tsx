import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, CalendarDays, Inbox } from 'lucide-react'
import { useAppState } from '../../app/app-state-context'
import { Button } from '../../components/ui/Button'
import { FeedbackPanel } from '../../components/ui/FeedbackPanel'
import type { useMarketSearch } from '../../hooks/useMarketSearch'
import { translate } from '../../i18n/translations'
import { ApiError, createAlert, disableAlert, getAlerts, getNotifications } from '../../services/api'
import { formatCurrency, formatFetchedAt } from '../../utils/format'
import { useAuth } from '../auth/auth-context'

type MarketSearchState = ReturnType<typeof useMarketSearch>

export function AlertManager({ market }: { market: MarketSearchState }) {
  const { language } = useAppState()
  const { session } = useAuth()
  const token = session?.access_token ?? ''
  const queryClient = useQueryClient()
  const [threshold, setThreshold] = useState('')
  const [direction, setDirection] = useState<'above' | 'below'>('above')
  const [confirmingId, setConfirmingId] = useState('')
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key)
  const alertsQuery = useQuery({
    queryKey: ['alerts', session?.user.id],
    queryFn: () => getAlerts(token),
    enabled: Boolean(token),
  })
  const notificationsQuery = useQuery({
    queryKey: ['notifications', session?.user.id],
    queryFn: () => getNotifications(token),
    enabled: Boolean(token),
  })
  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof createAlert>[0]) => createAlert(input, token),
    onSuccess: () => {
      setThreshold('')
      void queryClient.invalidateQueries({ queryKey: ['alerts', session?.user.id] })
    },
  })
  const disableMutation = useMutation({
    mutationFn: (id: string) => disableAlert(id, token),
    onSuccess: () => {
      setConfirmingId('')
      void queryClient.invalidateQueries({ queryKey: ['alerts', session?.user.id] })
    },
  })
  const accountUnavailable = [alertsQuery.error, notificationsQuery.error].some(
    (error) => error instanceof ApiError && error.status === 503,
  )
  const record = market.selectedRecord
  const canCreate = Boolean(
    record && market.pricesQuery.data?.verified && record.variety && record.grade && record.modal_price,
  )

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const target = Number(threshold)
    if (!record?.variety || !record.grade || !canCreate || !Number.isFinite(target) || target <= 0) return
    createMutation.mutate({
      state: record.state,
      district: record.district,
      market: record.market,
      commodity: record.commodity,
      variety: record.variety,
      grade: record.grade,
      threshold: target,
      direction,
      channel: 'in_app',
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={submit} className="rounded-3xl bg-paper p-5 shadow-panel sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-harvest-100 text-harvest-600"><Bell size={20} aria-hidden="true" /></span>
          <h2 className="text-xl font-bold text-forest-950">{t('createAlert')}</h2>
        </div>
        {accountUnavailable ? (
          <div className="mt-5"><FeedbackPanel compact kind="error" title={t('accountBackendUnavailable')} description={t('accountBackendHelp')} /></div>
        ) : !canCreate ? (
          <div className="mt-5"><FeedbackPanel compact title={t('alertNeedsRecord')} /></div>
        ) : (
          <>
            <div className="mt-5 rounded-2xl bg-sage-50 p-4">
              <p className="font-bold text-forest-950">{record!.commodity} · {record!.market}</p>
              <p className="mt-1 text-sm text-ink-600">{record!.variety} · {record!.grade} · {formatCurrency(record!.modal_price, language)}</p>
            </div>
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-forest-950">{t('targetRate')}</span>
              <input
                type="number"
                name="alert-threshold"
                autoComplete="off"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={threshold}
                onChange={(event) => setThreshold(event.target.value)}
                className="min-h-12 w-full rounded-xl bg-white px-3 text-base outline outline-1 -outline-offset-1 outline-forest-900/15 focus:outline-3 focus:outline-harvest-500"
              />
            </label>
            <fieldset className="mt-4">
              <legend className="sr-only">Alert condition</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['above', 'below'] as const).map((value) => (
                  <label key={value} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl px-3 text-sm font-semibold outline outline-1 -outline-offset-1 transition focus-within:outline-3 focus-within:outline-harvest-500 ${direction === value ? 'bg-forest-900 text-white outline-forest-900' : 'bg-sage-50 text-forest-950 outline-forest-900/10'}`}>
                    <input type="radio" className="sr-only" name="direction" value={value} checked={direction === value} onChange={() => setDirection(value)} />
                    {t(value)}
                  </label>
                ))}
              </div>
            </fieldset>
            {createMutation.isError ? <p role="alert" className="mt-3 text-sm text-red-700">{createMutation.error.message}</p> : null}
            <Button type="submit" className="mt-5 w-full" disabled={createMutation.isPending || !threshold}>
              {t(createMutation.isPending ? 'creatingAlert' : 'createAlert')}
            </Button>
          </>
        )}
      </form>

      <div className="grid gap-6">
        <section className="rounded-3xl bg-paper p-5 shadow-panel sm:p-7" aria-labelledby="active-alerts-heading">
          <h2 id="active-alerts-heading" className="text-xl font-bold text-forest-950">{t('activeAlerts')}</h2>
          {alertsQuery.isPending ? <p className="mt-5 text-sm text-ink-600">{t('loadingOptions')}</p> : null}
          {alertsQuery.isError ? <div className="mt-5"><FeedbackPanel compact kind="error" title={accountUnavailable ? t('accountBackendUnavailable') : alertsQuery.error.message} description={accountUnavailable ? t('accountBackendHelp') : undefined} /></div> : null}
          {alertsQuery.data?.length === 0 ? <div className="mt-5"><FeedbackPanel compact title={t('noAlerts')} /></div> : null}
          <div className="mt-4 grid gap-3">
            {alertsQuery.data?.map((alert) => (
              <article key={alert.id} className={`rounded-2xl p-4 ${alert.enabled ? 'bg-sage-50' : 'bg-stone-100 opacity-70'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-forest-950">{alert.commodity} · {alert.market}</h3>
                    <p className="mt-1 text-sm text-ink-600">{alert.variety} · {alert.grade}</p>
                    <p className="tabular-nums mt-2 text-sm font-semibold text-forest-800">{t(alert.direction)} {formatCurrency(alert.threshold, language)}</p>
                  </div>
                  <BellOff size={19} className="shrink-0 text-ink-500" aria-hidden="true" />
                </div>
                {alert.enabled && confirmingId !== alert.id ? (
                  <Button type="button" variant="quiet" className="mt-3" onClick={() => setConfirmingId(alert.id)}>{t('disableAlert')}</Button>
                ) : null}
                {alert.enabled && confirmingId === alert.id ? (
                  <div className="mt-3 rounded-xl bg-paper p-3">
                    <p className="text-sm font-semibold">{t('confirmDisable')}</p>
                    <div className="mt-2 flex gap-2">
                      <Button type="button" variant="danger" disabled={disableMutation.isPending} onClick={() => disableMutation.mutate(alert.id)}>{t('confirm')}</Button>
                      <Button type="button" variant="quiet" onClick={() => setConfirmingId('')}>{t('cancel')}</Button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-paper p-5 shadow-panel sm:p-7" aria-labelledby="notifications-heading">
          <div className="flex items-center gap-3">
            <Inbox size={20} className="text-forest-700" aria-hidden="true" />
            <h2 id="notifications-heading" className="text-xl font-bold text-forest-950">{t('notifications')}</h2>
          </div>
          {notificationsQuery.isError ? <div className="mt-5"><FeedbackPanel compact kind="error" title={accountUnavailable ? t('accountBackendUnavailable') : notificationsQuery.error.message} description={accountUnavailable ? t('accountBackendHelp') : undefined} /></div> : null}
          {notificationsQuery.data?.items.length === 0 ? <div className="mt-5"><FeedbackPanel compact title={t('noNotifications')} /></div> : null}
          <div className="mt-4 grid gap-3">
            {notificationsQuery.data?.items.map((item) => (
              <article key={item.id} className="rounded-2xl bg-sage-50 p-4">
                <p className="font-semibold text-forest-950">{language === 'hi' ? 'भाव अलर्ट का रिकॉर्ड मिला' : 'A price alert matched a record'}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-xs text-ink-600"><CalendarDays size={14} aria-hidden="true" /> {formatFetchedAt(item.created_at, language)}</p>
                <p className="mt-1 text-xs text-ink-500">{item.status} · {item.channel}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

