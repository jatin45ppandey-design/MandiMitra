import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Calculator, IndianRupee, Truck } from 'lucide-react'
import { useAppState } from '../../app/app-state-context'
import { Button } from '../../components/ui/Button'
import { FeedbackPanel } from '../../components/ui/FeedbackPanel'
import { translate } from '../../i18n/translations'
import { estimateTransport } from '../../services/api'
import type { MarketPrice, TransportInput } from '../../types/mandi'
import { formatCurrency } from '../../utils/format'

interface TransportSectionProps {
  record: MarketPrice | null
  verified: boolean
  compact?: boolean
}

type FormState = Record<
  'quantity_quintals' | 'transport_cost' | 'loading_cost' | 'market_fees' | 'other_costs',
  string
>

const initialForm: FormState = {
  quantity_quintals: '',
  transport_cost: '',
  loading_cost: '',
  market_fees: '',
  other_costs: '',
}

export function TransportSection({ record, verified, compact = false }: TransportSectionProps) {
  const { language } = useAppState()
  const [form, setForm] = useState<FormState>(initialForm)
  const [validationMessage, setValidationMessage] = useState('')
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key)
  const mutation = useMutation({ mutationFn: estimateTransport })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!record?.modal_price || !verified) return
    const input: TransportInput = {
      rate_per_quintal: record.modal_price,
      quantity_quintals: Number(form.quantity_quintals),
      transport_cost: Number(form.transport_cost || 0),
      loading_cost: Number(form.loading_cost || 0),
      market_fees: Number(form.market_fees || 0),
      other_costs: Number(form.other_costs || 0),
    }
    if (
      !Number.isFinite(input.quantity_quintals) ||
      input.quantity_quintals <= 0 ||
      [input.transport_cost, input.loading_cost, input.market_fees, input.other_costs].some(
        (value) => !Number.isFinite(value) || value < 0,
      )
    ) {
      setValidationMessage(t('invalidCalculation'))
      return
    }
    setValidationMessage('')
    mutation.mutate(input)
  }

  const fields = [
    ['quantity_quintals', 'quantity'],
    ['transport_cost', 'transportCost'],
    ['loading_cost', 'loadingCost'],
    ['market_fees', 'marketFees'],
    ['other_costs', 'otherCosts'],
  ] as const

  return (
    <section className={`rounded-3xl bg-paper shadow-panel ${compact ? 'p-5' : 'p-5 sm:p-7'}`} aria-labelledby="transport-heading">
      <div className="mb-6 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-harvest-100 text-harvest-600">
          <Truck size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 id="transport-heading" className="text-xl font-bold tracking-tight text-forest-950">{t('transportTitle')}</h2>
          <p className="mt-1 text-sm leading-6 text-ink-600">{t('transportIntro')}</p>
        </div>
      </div>
      {!record || !verified || record.modal_price === null ? (
        <FeedbackPanel compact title={t('chooseForPrice')} />
      ) : (
        <form onSubmit={submit} noValidate>
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl bg-sage-50 px-4 py-3">
            <div>
              <p className="text-xs text-ink-600">{record.market}</p>
              <p className="text-sm font-semibold text-forest-950">{record.commodity} · {record.variety ?? '—'} · {record.grade ?? '—'}</p>
            </div>
            <p className="tabular-nums whitespace-nowrap font-bold text-forest-950">{formatCurrency(record.modal_price, language)}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(([name, labelKey], index) => (
              <label key={name} className={index === 0 ? 'sm:col-span-2' : ''}>
                <span className="mb-2 block text-sm font-semibold text-forest-950">{t(labelKey)}</span>
                <span className="relative block">
                  {index > 0 ? <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" aria-hidden="true" /> : null}
                  <input
                    name={name}
                    autoComplete="off"
                    type="number"
                    inputMode="decimal"
                    min={index === 0 ? '0.01' : '0'}
                    step="0.01"
                    value={form[name]}
                    onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
                    className={`min-h-12 w-full rounded-xl bg-white pr-3 text-base text-forest-950 outline outline-1 -outline-offset-1 outline-forest-900/15 transition focus:outline-3 focus:outline-harvest-500 ${index > 0 ? 'pl-9' : 'px-3'}`}
                  />
                </span>
              </label>
            ))}
          </div>
          {validationMessage ? <p role="alert" className="mt-4 text-sm font-medium text-red-700">{validationMessage}</p> : null}
          {mutation.isError ? <p role="alert" className="mt-4 text-sm font-medium text-red-700">{t('genericError')}</p> : null}
          <Button type="submit" className="mt-5 w-full sm:w-auto" disabled={mutation.isPending}>
            <Calculator size={18} aria-hidden="true" />
            {t(mutation.isPending ? 'calculating' : 'calculate')}
          </Button>
        </form>
      )}
      {mutation.data ? (
        <div className="mt-6" aria-live="polite">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-sage-50 p-4">
              <dt className="text-xs text-ink-600">{t('grossEstimate')}</dt>
              <dd className="tabular-nums mt-1 font-bold text-forest-950">{formatCurrency(mutation.data.gross_estimate, language)}</dd>
            </div>
            <div className="rounded-2xl bg-sage-50 p-4">
              <dt className="text-xs text-ink-600">{t('totalCosts')}</dt>
              <dd className="tabular-nums mt-1 font-bold text-red-800">− {formatCurrency(mutation.data.total_costs, language)}</dd>
            </div>
            <div className="rounded-2xl bg-forest-900 p-4 text-white">
              <dt className="text-xs text-sage-200">{t('netEstimate')}</dt>
              <dd className="tabular-nums mt-1 text-lg font-extrabold">{formatCurrency(mutation.data.net_estimate, language)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-5 text-ink-600">{t('estimateOnly')}</p>
        </div>
      ) : null}
    </section>
  )
}

