import { useReducedMotion } from 'motion/react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Language, TrendObservation } from '../../types/mandi'
import { formatCurrency, formatReportedDate } from '../../utils/format'

interface TrendChartProps { observations: TrendObservation[]; language: Language }
const MS_DAY = 86_400_000
export default function TrendChart({ observations, language }: TrendChartProps) {
  const reduceMotion = useReducedMotion()
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN'
  const points: Array<{date:string, day:number, modal_price:number|null}> = []
  observations.forEach((observation,index) => {
    const day = Date.parse(`${observation.report_date}T00:00:00Z`)
    if (!Number.isFinite(day)) return
    const previous = index > 0 ? Date.parse(`${observations[index-1].report_date}T00:00:00Z`) : null
    if (previous !== null && Number.isFinite(previous) && day - previous > MS_DAY) {
      // An explicit NULL separator breaks the line. No price is estimated for absent dates.
      points.push({date: '', day: previous + (day - previous) / 2, modal_price: null})
    }
    points.push({date:observation.report_date,day,modal_price:observation.modal_price})
  })
  const dateLabel = (ms: number) => formatReportedDate(new Date(ms).toISOString().slice(0,10),locale)
  return (
    <div>
      <div className="h-64 w-full" role="img" aria-label={language === 'hi' ? 'असली रिपोर्ट किए हुए भावों का चार्ट' : 'Chart of genuine reported modal prices'}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{top:12,right:10,bottom:4,left:0}}>
            <CartesianGrid vertical={false} stroke="#d0dfc8" strokeDasharray="4 6"/>
            <XAxis type="number" dataKey="day" domain={['dataMin','dataMax']} scale="time" tick={{fontSize:11,fill:'#566a62'}} tickFormatter={dateLabel} tickLine={false} axisLine={false} minTickGap={20}/>
            <YAxis tick={{fontSize:11,fill:'#566a62'}} tickLine={false} axisLine={false} width={58} tickFormatter={(v:number)=>`₹${Math.round(v)}`} domain={['dataMin','dataMax']}/>
            <Tooltip content={({active,payload})=>{
              const point=payload?.[0]?.payload as (typeof points)[number]|undefined
              if(!active||!point||point.modal_price===null)return null
              return <div className="rounded-xl bg-forest-950 px-3 py-2 text-xs text-white shadow-panel">
                <p className="font-semibold">{dateLabel(point.day)}</p>
                <p className="mt-1 text-sage-200">{formatCurrency(point.modal_price,language)}</p>
              </div>
            }}/>
            <Line type="linear" dataKey="modal_price" stroke="#174b37" strokeWidth={3}
              connectNulls={false} dot={{r:3,fill:'#bf8428',strokeWidth:0}}
              activeDot={{r:5,fill:'#bf8428',stroke:'#fffdf8',strokeWidth:2}}
              isAnimationActive={!reduceMotion} animationDuration={260}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only">{observations.map(item=><li key={item.report_date}>
        {formatReportedDate(item.report_date,locale)}: {formatCurrency(item.modal_price,language)}, {item.market}
      </li>)}</ul>
    </div>
  )
}
