import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAppState } from '../app-state-context'
import { translate } from '../../i18n/translations'

export function NotFoundPage() {
  const { language } = useAppState()
  return (
    <section className="mx-auto max-w-2xl rounded-3xl bg-sage-100 p-8 text-center sm:p-12">
      <p className="text-6xl font-extrabold tracking-tight text-forest-900">404</p>
      <h1 className="mt-4 text-2xl font-bold text-forest-950">{translate(language, 'pageNotFound')}</h1>
      <p className="mt-2 text-ink-600">{translate(language, 'pageNotFoundHelp')}</p>
      <Link to="/" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-forest-900 px-4 text-sm font-semibold text-white transition hover:bg-forest-800 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-harvest-500">
        <ArrowLeft size={18} aria-hidden="true" /> {translate(language, 'backHome')}
      </Link>
    </section>
  )
}

