import { useReducedMotion } from 'motion/react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Language, TrendObservation } from '../../types/mandi'
import { formatCurrency, formatReportedDate } from '../../utils/format'

interface TrendChartProps {
  observations: TrendObservation[]
  language: Language
}

export default function TrendChart({ observations, language }: TrendChartProps) {
  const reduceMotion = useReducedMotion()
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN'
  const data = observations.map((item) => ({
    ...item,
    label: formatReportedDate(item.report_date, locale),
  }))
  return (
    <div>
      <div className="h-64 w-full" role="img" aria-label="Reported modal price trend chart">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 10, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#d0dfc8" strokeDasharray="4 6" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#566a62' }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis
            tick={{ fontSize: 11, fill: '#566a62' }}
            tickLine={false}
            axisLine={false}
            width={58}
            tickFormatter={(value: number) => `₹${Math.round(value)}`}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip
            cursor={{ stroke: '#8cab80', strokeDasharray: '4 4' }}
            content={({ active, payload }) => {
              const item = payload?.[0]?.payload as (typeof data)[number] | undefined
              if (!active || !item) return null
              return (
                <div className="rounded-xl bg-forest-950 px-3 py-2 text-xs text-white shadow-panel">
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-1 text-sage-200">{formatCurrency(item.modal_price, language)}</p>
                </div>
              )
            }}
          />
          <Line
            type="monotone"
            dataKey="modal_price"
            stroke="#174b37"
            strokeWidth={3}
            dot={{ r: 3, fill: '#bf8428', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#bf8428', stroke: '#fffdf8', strokeWidth: 2 }}
            isAnimationActive={!reduceMotion}
            animationDuration={260}
          />
        </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only">
        {data.map((item) => (
          <li key={`${item.report_date}-${item.market}`}>
            {item.label}: {formatCurrency(item.modal_price, language)}, {item.market}
          </li>
        ))}
      </ul>
    </div>
  )
}

