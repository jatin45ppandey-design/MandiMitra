import { Bell, House, MapPinned, MessageCircle, Sprout, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppState } from '../../app/app-state-context'
import { translate } from '../../i18n/translations'
import { BackendStatus } from '../common/BackendStatus'
import { LanguageSwitch } from '../../features/farmer-preferences/LanguageSwitch'
import { OfflineBanner } from './OfflineBanner'

const links = [
  { to: '/', key: 'navHome', icon: House, end: true },
  { to: '/compare', key: 'navCompare', icon: MapPinned, end: false },
  { to: '/alerts', key: 'navAlerts', icon: Bell, end: false },
  { to: '/advisor', key: 'navAdvisor', icon: MessageCircle, end: false },
  { to: '/profile', key: 'navProfile', icon: UserRound, end: false },
] as const

export function AppShell() {
  const { language, selections } = useAppState()
  const selectionQuery = new URLSearchParams(
    Object.entries(selections).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString()
  return (
    <div className="min-h-dvh text-ink-950" lang={language}>
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-50 -translate-y-20 rounded-lg bg-forest-950 px-4 py-3 text-sm font-semibold text-white transition focus:translate-y-0"
      >
        {translate(language, 'skipToContent')}
      </a>
      <OfflineBanner />
      <header className="sticky top-0 z-20 bg-ivory/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-harvest-500">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest-900 text-sage-100">
              <Sprout size={24} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-extrabold tracking-tight text-forest-950">MandiMitra</span>
              <span className="hidden truncate text-xs text-ink-600 sm:block">{translate(language, 'tagline')}</span>
            </span>
          </NavLink>
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
            {links.map(({ to, key, end }) => (
              <NavLink
                key={to}
                to={`${to}${selectionQuery ? `?${selectionQuery}` : ''}`}
                end={end}
                className={({ isActive }) =>
                  `min-h-11 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-harvest-500 ${
                    isActive ? 'bg-sage-100 text-forest-950' : 'text-ink-600 hover:bg-sage-50 hover:text-forest-950'
                  }`
                }
              >
                {translate(language, key)}
              </NavLink>
            ))}
          </nav>
          <LanguageSwitch />
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-7xl px-4 pb-28 pt-7 sm:px-6 sm:pt-10 md:pb-16 lg:px-8">
        <Outlet />
      </main>
      <footer className="hidden bg-sage-50 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5 text-xs text-ink-600 lg:px-8">
          <p className="max-w-2xl leading-5">{translate(language, 'footerNote')}</p>
          <BackendStatus />
        </div>
      </footer>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 bg-paper/96 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_38px_-28px_rgb(18_53_42_/_0.65)] backdrop-blur-sm md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {links.map(({ to, key, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={`${to}${selectionQuery ? `?${selectionQuery}` : ''}`}
              end={end}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[0.72rem] font-semibold transition focus-visible:outline-3 focus-visible:outline-harvest-500 ${
                  isActive ? 'bg-sage-100 text-forest-950' : 'text-ink-500'
                }`
              }
            >
              <Icon size={20} strokeWidth={2.1} aria-hidden="true" />
              <span>{key === 'navAdvisor' ? (language === 'hi' ? 'सलाह' : 'Advisor') : translate(language, key as Parameters<typeof translate>[1])}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

