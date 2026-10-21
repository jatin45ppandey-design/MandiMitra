import { useEffect } from 'react'
import { useAppState } from '../../app/app-state-context'
import { getPreferences } from '../../services/api'
import { useAuth } from './auth-context'

/** Restore cloud defaults on a new device, without overriding active local selections. */
export function CloudPreferenceLoader() {
  const {session}=useAuth()
  const {applyCloudPreferences}=useAppState()
  useEffect(()=>{
    const token=session?.access_token
    if(!token)return
    let active=true
    void getPreferences(token).then(p=>{
      if(active && p) applyCloudPreferences(p)
    }).catch(()=>{ /* Public prices remain available if cloud account is offline. */ })
    return ()=>{active=false}
  },[session?.user.id,session?.access_token,applyCloudPreferences])
  return null
}
