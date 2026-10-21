import { describe, it, expect } from 'vitest'
import { offlineTrends, offlineCompare } from './offline-analytics'
import type { MandiSnapshot, MarketPrice } from '../types/mandi'

const row = (market:string, date:string, price:number, grade='FAQ'):MarketPrice => ({
  state:'Uttar Pradesh',district:'Lucknow',commodity:'Wheat',market,variety:'Dara',
  grade,arrival_date:date,min_price:price,max_price:price,modal_price:price,
  price_unit:'INR/quintal',source:'Official test fixture',fetched_at:null,
})
const snap = { metadata:{source:'test',fetched_at:null,latest_report_date:'2026-10-13',
  record_count:3,verified:true,partial:true,filters:{},rejected_records:0},
  records:[row('A','2026-10-11',2000),row('A','2026-10-13',2300),row('A','2026-10-12',9000,'Other'),row('B','2026-10-13',2450)]
} as MandiSnapshot

describe('verified offline analytics',()=>{
  it('never interpolates or includes another grade in trends',()=>{
    const data = offlineTrends(snap,{state:'Uttar Pradesh',district:'Lucknow',commodity:'Wheat',market:'A',variety:'Dara',grade:'FAQ'})
    expect(data.observations.map(x=>x.report_date)).toEqual(['2026-10-11','2026-10-13'])
  })
  it('picks one current observation per comparable market',()=>{
    const x=offlineCompare(snap,{state:'Uttar Pradesh',district:'Lucknow',commodity:'Wheat',variety:'Dara',grade:'FAQ'})
    expect(x.records).toHaveLength(2)
    expect(x.records.find(r=>r.market==='A')?.modal_price).toBe(2300)
  })
})
