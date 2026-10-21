import type { ReactNode } from 'react'
import { AlertCircle, Database, LoaderCircle } from 'lucide-react'
import { Button } from './Button'

interface FeedbackPanelProps {
  title: string
  description?: string
  kind?: 'empty' | 'error' | 'loading'
  actionLabel?: string
  onAction?: () => void
  compact?: boolean
  children?: ReactNode
}

export function FeedbackPanel({
  title,
  description,
  kind = 'empty',
  actionLabel,
  onAction,
  compact = false,
  children,
}: FeedbackPanelProps) {
  const Icon = kind === 'error' ? AlertCircle : kind === 'loading' ? LoaderCircle : Database
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`flex flex-col items-start rounded-2xl bg-sage-50 ${compact ? 'p-4' : 'min-h-44 p-6 sm:p-7'}`}
    >
      <Icon
        className={`mb-4 text-forest-700 ${kind === 'loading' ? 'animate-spin' : ''}`}
        size={22}
        aria-hidden="true"
      />
      <p className="font-semibold text-forest-950">{title}</p>
      {description ? <p className="mt-2 max-w-xl text-sm leading-6 text-ink-600">{description}</p> : null}
      {children}
      {actionLabel && onAction ? (
        <Button variant="secondary" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

