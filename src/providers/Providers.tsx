'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { NotificationProvider } from '@/components/feedback/NotificationSystem'
import { QueryCache } from '@/lib/cache/QueryCache'
import { AuthProvider } from './AuthProvider'
import { OfflineProvider } from './OfflineProvider'
import { ToastProvider } from '@/components/ui/toast-exports'
import { SystemSettingsProvider } from '@/contexts/SystemSettingsContext'

const CACHE_CONFIG = {
  ttl: 30 * 1000, // 30 seconds - optimisé pour un rafraîchissement quasi temps réel
  maxItems: 100,
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: CACHE_CONFIG.ttl, // 30 secondes
          refetchOnWindowFocus: true, // Rafraîchissement automatique au focus
          refetchInterval: 2 * 60 * 1000, // 2 minutes par défaut
          retry: 1,
          retryDelay: 1000,
        },
        mutations: {
          retry: 1,
          retryDelay: 1000,
        },
      },
    })

    // Initialize cache system
    new QueryCache(client, CACHE_CONFIG)

    return client
  })

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SystemSettingsProvider>
          <AuthProvider>
            <NotificationProvider>
              <ToastProvider>
                <OfflineProvider>
                  {children}
                </OfflineProvider>
              </ToastProvider>
            </NotificationProvider>
          </AuthProvider>
        </SystemSettingsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

