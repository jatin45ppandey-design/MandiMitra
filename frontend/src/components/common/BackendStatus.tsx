import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../../services/api'
import type { Language } from '../../i18n/translations'
import { copy } from '../../i18n/translations'

export function BackendStatus({ language }: { language: Language }) {
  const { isPending, isError } = useQuery({
    queryKey: ['backend-health'],
    queryFn: getHealth,
    retry: false,
    staleTime: 30_000
  })
  const label = isPending
    ? copy[language].apiChecking
    : isError
      ? copy[language].apiOffline
      : copy[language].apiConnected
  return (
    <div role="status" className="flex items-center gap-2 text-xs text-emerald-950/60">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${isPending ? 'bg-amber-500' : isError ? 'bg-slate-400' : 'bg-emerald-500'}`} />
      {label}
    </div>
  )
}

