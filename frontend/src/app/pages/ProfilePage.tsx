import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CloudUpload, Heart, RotateCcw, X } from 'lucide-react'
import { useAppState } from '../app-state-context'
import { Button } from '../../components/ui/Button'
import { AuthPanel } from '../../features/auth/AuthPanel'
import { useAuth } from '../../features/auth/auth-context'
import { translate } from '../../i18n/translations'
import { savePreferences } from '../../services/api'

export function ProfilePage() {
  const app = useAppState()
  const auth = useAuth()
  const [confirmClear, setConfirmClear] = useState(false)
  const [message, setMessage] = useState('')
  const t = (key: Parameters<typeof translate>[1]) => translate(app.language, key)
  const syncMutation = useMutation({
    mutationFn: () =>
      savePreferences(
        {
          language: app.language,
          default_state: app.selections.state || null,
          default_district: app.selections.district || null,
          default_commodity: app.selections.commodity || null,
        },
        auth.session!.access_token,
      ),
    onSuccess: () => setMessage(t('preferencesSaved')),
  })
  return (
    <div>
      <header className="mb-7 max-w-3xl">
        <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-[-0.035em] text-forest-950 sm:text-4xl">{t('profileHeadline')}</h1>
        <p className="mt-3 text-base leading-7 text-ink-600">{t('profileIntro')}</p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <AuthPanel />
        <section className="rounded-3xl bg-paper p-5 shadow-panel sm:p-7" aria-labelledby="local-preferences-heading">
          <h2 id="local-preferences-heading" className="text-xl font-bold text-forest-950">{t('localPreferences')}</h2>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-sage-50 p-4"><dt className="text-ink-600">{t('state')}</dt><dd className="mt-1 font-semibold text-forest-950">{app.selections.state || '—'}</dd></div>
            <div className="rounded-2xl bg-sage-50 p-4"><dt className="text-ink-600">{t('district')}</dt><dd className="mt-1 font-semibold text-forest-950">{app.selections.district || '—'}</dd></div>
            <div className="col-span-2 rounded-2xl bg-sage-50 p-4"><dt className="text-ink-600">{t('commodity')}</dt><dd className="mt-1 font-semibold text-forest-950">{app.selections.commodity || '—'}</dd></div>
          </dl>
          <div className="mt-6">
            <h3 className="inline-flex items-center gap-2 font-bold text-forest-950"><Heart size={18} aria-hidden="true" /> {t('savedCrops')}</h3>
            {app.savedCrops.length === 0 ? <p className="mt-3 text-sm text-ink-600">{t('noSavedCrops')}</p> : (
              <div className="mt-3 flex flex-wrap gap-2">
                {app.savedCrops.map((crop) => (
                  <button key={crop} type="button" onClick={() => app.toggleSavedCrop(crop)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sage-100 px-3 text-sm font-semibold text-forest-950 transition hover:bg-sage-200 focus-visible:outline-3 focus-visible:outline-harvest-500">
                    {crop} <X size={15} aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {auth.session ? (
            <Button type="button" variant="secondary" className="mt-6" disabled={syncMutation.isPending} onClick={() => syncMutation.mutate()}>
              <CloudUpload size={18} aria-hidden="true" /> {t('syncPreferences')}
            </Button>
          ) : null}
          {syncMutation.isError ? <p role="alert" className="mt-3 text-sm text-red-700">{syncMutation.error.message}</p> : null}
          {message ? <p role="status" className="mt-3 text-sm font-medium text-forest-800">{message}</p> : null}
          {!confirmClear ? (
            <Button type="button" variant="quiet" className="mt-4" onClick={() => setConfirmClear(true)}><RotateCcw size={18} aria-hidden="true" /> {t('clearPreferences')}</Button>
          ) : (
            <div className="mt-5 rounded-2xl bg-harvest-100 p-4">
              <p className="text-sm font-semibold text-harvest-600">{t('confirmClearPreferences')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="danger" onClick={() => { app.clearLocalPreferences(); setConfirmClear(false); setMessage(t('cleared')) }}>{t('confirm')}</Button>
                <Button type="button" variant="quiet" onClick={() => setConfirmClear(false)}>{t('cancel')}</Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

