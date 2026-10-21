import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from '../../services/supabase'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined
    void getSupabaseClient().then(async (client) => {
      if (!client) {
        if (active) setLoading(false)
        return
      }
      const { data } = await client.auth.getSession()
      if (!active) return
      setSession(data.session)
      setLoading(false)
      const listener = client.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession)
        setLoading(false)
      })
      unsubscribe = () => listener.data.subscription.unsubscribe()
    })
    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string) => {
    const client = await getSupabaseClient()
    if (!client) throw new Error('Supabase authentication is not configured.')
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/profile` },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const client = await getSupabaseClient()
    if (!client) return
    const { error } = await client.auth.signOut()
    if (error) throw error
  }, [])

  const value = useMemo(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      signInWithEmail,
      signOut,
    }),
    [loading, session, signInWithEmail, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

