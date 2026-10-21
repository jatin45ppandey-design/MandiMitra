import { useState, type FormEvent } from 'react'
import { LogIn, LogOut, Mail, UserRound } from 'lucide-react'
import { useAppState } from '../../app/app-state-context'
import { Button } from '../../components/ui/Button'
import { FeedbackPanel } from '../../components/ui/FeedbackPanel'
import { translate } from '../../i18n/translations'
import { useAuth } from './auth-context'

export function AuthPanel() {
  const { language } = useAppState()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key)

  if (auth.loading) return <FeedbackPanel kind="loading" title={t('backendChecking')} />
  if (!auth.configured) {
    return <FeedbackPanel title={t('authNotConfigured')} description={t('signInRequiredHelp')} />
  }

  if (auth.user) {
    return (
      <div className="rounded-3xl bg-sage-100 p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest-900 text-white"><UserRound size={21} aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-sm text-ink-600">{t('signedInAs')}</p>
            <p className="truncate font-bold text-forest-950">{auth.user.email ?? auth.user.id}</p>
          </div>
        </div>
        {!confirmSignOut ? (
          <Button type="button" variant="quiet" className="mt-5" onClick={() => setConfirmSignOut(true)}>
            <LogOut size={18} aria-hidden="true" /> {t('signOut')}
          </Button>
        ) : (
          <div className="mt-5 rounded-2xl bg-paper p-4">
            <p className="text-sm font-semibold text-forest-950">{t('confirmSignOut')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="danger"
                onClick={() => void auth.signOut().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : t('genericError')))}
              >
                {t('signOut')}
              </Button>
              <Button type="button" variant="quiet" onClick={() => setConfirmSignOut(false)}>{t('cancel')}</Button>
            </div>
          </div>
        )}
        {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
      </div>
    )
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!email || !email.includes('@')) {
      setError(language === 'hi' ? 'सही ईमेल पता दर्ज करें।' : 'Enter a valid email address.')
      return
    }
    setSubmitting(true)
    try {
      await auth.signInWithEmail(email)
      setMessage(t('magicLinkSent'))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('genericError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="rounded-3xl bg-sage-100 p-5 sm:p-7" noValidate>
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-forest-900 text-white"><LogIn size={20} aria-hidden="true" /></span>
        <h2 className="text-xl font-bold text-forest-950">{t('signIn')}</h2>
      </div>
      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-semibold text-forest-950">{t('email')}</span>
        <span className="relative block">
          <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" aria-hidden="true" />
          <input
            type="email"
            name="email"
            autoComplete="email"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-12 w-full rounded-xl bg-white py-2 pl-10 pr-3 text-base outline outline-1 -outline-offset-1 outline-forest-900/15 focus:outline-3 focus:outline-harvest-500"
          />
        </span>
      </label>
      {error ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
      {message ? <p role="status" className="mt-3 text-sm font-medium text-forest-800">{message}</p> : null}
      <Button type="submit" className="mt-5 w-full sm:w-auto" disabled={submitting}>
        {t(submitting ? 'sendingLink' : 'sendMagicLink')}
      </Button>
    </form>
  )
}

