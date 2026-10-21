import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAppState } from '../app-state-context'
import { AlertManager } from '../../features/alerts/AlertManager'
import { useAuth } from '../../features/auth/auth-context'
import { PriceSearchPanel } from '../../features/mandi-prices/PriceSearchPanel'
import { useMarketSearch } from '../../hooks/useMarketSearch'
import { translate } from '../../i18n/translations'

export function AlertsPage() {
  const { language } = useAppState()
  const auth = useAuth()
  const market = useMarketSearch()
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key)
  return (
    <div>
      <header className="mb-7 max-w-3xl">
        <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-[-0.035em] text-forest-950 sm:text-4xl">{t('alertsHeadline')}</h1>
        <p className="mt-3 text-base leading-7 text-ink-600">{t('alertsIntro')}</p>
      </header>
      {!auth.session ? (
        <section className="rounded-3xl bg-sage-100 p-6 sm:p-8">
          <span className="grid size-12 place-items-center rounded-xl bg-forest-900 text-white"><Bell size={22} aria-hidden="true" /></span>
          <h2 className="mt-5 text-2xl font-bold text-forest-950">{t('signInRequired')}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">{auth.configured ? t('signInRequiredHelp') : t('authNotConfigured')}</p>
          <Link to="/profile" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-forest-900 px-4 text-sm font-semibold text-white transition hover:bg-forest-800 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-harvest-500">{t('navProfile')}</Link>
        </section>
      ) : (
        <>
          <PriceSearchPanel market={market} includeMarket compact />
          <div className="mt-6"><AlertManager market={market} /></div>
        </>
      )}
      <Link to="/" className="sr-only">{t('backHome')}</Link>
    </div>
  )
}

