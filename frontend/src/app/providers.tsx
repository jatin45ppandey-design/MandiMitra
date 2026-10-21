import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { AppStateProvider } from './AppStateProvider'
import { AuthProvider } from '../features/auth/AuthProvider'
import { CloudPreferenceLoader } from '../features/auth/CloudPreferenceLoader'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <AuthProvider><CloudPreferenceLoader />{children}</AuthProvider>
      </AppStateProvider>
    </QueryClientProvider>
  )
}

