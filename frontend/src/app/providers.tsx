import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { AppStateProvider } from './AppStateProvider'
import { AuthProvider } from '../features/auth/AuthProvider'

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
        <AuthProvider>{children}</AuthProvider>
      </AppStateProvider>
    </QueryClientProvider>
  )
}

