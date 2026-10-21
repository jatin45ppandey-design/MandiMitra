import { WifiOff } from 'lucide-react'
import { useAppState } from '../../app/app-state-context'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { translate } from '../../i18n/translations'
import { formatReportedDate } from '../../utils/format'

export function OfflineBanner() {
  const online = useOnlineStatus()
  const { language, lastVerifiedReportDate } = useAppState()
  if (online) return null
  const message = lastVerifiedReportDate
    ? translate(language, 'offlineBanner', {
        date: formatReportedDate(lastVerifiedReportDate, language === 'hi' ? 'hi-IN' : 'en-IN'),
      })
    : translate(language, 'offlineNoDate')
  return (
    <div role="status" className="bg-harvest-100 px-4 py-2.5 text-harvest-600">
      <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm font-semibold">
        <WifiOff size={17} aria-hidden="true" />
        <span>{message}</span>
      </div>
    </div>
  )
}

