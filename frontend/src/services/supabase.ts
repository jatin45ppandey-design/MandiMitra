import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

function isConfiguredValue(value: string): boolean {
  return Boolean(value) && !value.startsWith('REPLACE_WITH_')
}

export const isSupabaseConfigured =
  isConfiguredValue(supabaseUrl) && isConfiguredValue(publishableKey)

let clientPromise: Promise<SupabaseClient | null> | null = null

export function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null)
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(supabaseUrl, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }),
  )
  return clientPromise
}

