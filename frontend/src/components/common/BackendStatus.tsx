import { useQuery } from '@tanstack/react-query'
import { Cloud, CloudOff, LoaderCircle } from 'lucide-react'
import { getHealth } from '../../services/api'
import { useAppState } from '../../app/app-state-context'
import { translate } from '../../i18n/translations'

export function BackendStatus() {
  const { language } = useAppState()
  const { isPending, isError } = useQuery({
    queryKey: ['backend-health'],
    queryFn: ({ signal }) => getHealth(signal),
    retry: false,
    staleTime: 30_000,
  })
  const label = isPending
    ? translate(language, 'backendChecking')
    : isError
      ? translate(language, 'backendUnavailable')
      : translate(language, 'backendConnected')
  const Icon = isPending ? LoaderCircle : isError ? CloudOff : Cloud
  return (
    <div role="status" className="inline-flex min-h-9 items-center gap-2 text-xs font-medium text-ink-600">
      <Icon size={15} className={isPending ? 'animate-spin' : ''} aria-hidden="true" />
      {label}
    </div>
  )
}

