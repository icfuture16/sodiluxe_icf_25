import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { useNotification } from '@/components/feedback/NotificationSystem'
import { QueryCache } from '@/lib/cache/QueryCache'
import { useCallback, useRef, useEffect } from 'react'

interface CachedQueryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  namespace: string
  key: string
  ttl?: number
  successMessage?: string
  errorMessage?: string
  retryCount?: number
  priority?: 'high' | 'medium' | 'low'
  showSuccessOnlyOnce?: boolean
  showSuccessOnlyOnManualRefetch?: boolean
  useSubtleLoadingIndicator?: boolean
  queryFn: () => Promise<TData>
}

export function useCachedQuery<TData, TError = Error>({
  namespace,
  key,
  successMessage,
  errorMessage,
  priority = 'medium',
  retryCount = 1,
  showSuccessOnlyOnce = false,
  showSuccessOnlyOnManualRefetch = false,
  useSubtleLoadingIndicator = false,
  ...options
}: CachedQueryOptions<TData, TError>) {
  const { showNotification, clearNotification } = useNotification()

  const notificationId = useRef<string | null>(null)
  const hasShownSuccessNotification = useRef<boolean>(false)
  const isManualRefetch = useRef<boolean>(false)

  const showLoadingNotification = useCallback(() => {
    if (!notificationId.current) {
      notificationId.current = showNotification({
        type: 'loading',
        message: 'Chargement en cours...',
        priority,
      })
    }
  }, [showNotification, priority])

  const clearLoadingNotification = useCallback(() => {
    if (notificationId.current) {
      clearNotification(notificationId.current)
      notificationId.current = null
    }
  }, [clearNotification])

  const result = useQuery<TData, TError>({
    queryKey: [namespace, key],
    ...options,
    retry: retryCount,
  })

  const { data, error, isLoading, isSuccess, isError, refetch: originalRefetch } = result
  
  // Wrap refetch to track manual refetches
  const refetch = useCallback(async () => {
    isManualRefetch.current = true
    const result = await originalRefetch()
    return result
  }, [originalRefetch])
  
  // Add refetch to the result
  Object.assign(result, { refetch })

  useEffect(() => {
    if (isLoading) {
      if (useSubtleLoadingIndicator) {
        // Utiliser un indicateur visuel subtil au lieu d'une notification complète
        // Cela pourrait être une petite animation ou un indicateur dans l'interface
        document.body.classList.add('subtle-loading')
      } else {
        showLoadingNotification()
      }
    } else if (!isLoading && useSubtleLoadingIndicator) {
      document.body.classList.remove('subtle-loading')
    }
  }, [isLoading, showLoadingNotification, useSubtleLoadingIndicator])

  useEffect(() => {
    if (isSuccess && data) {
      clearLoadingNotification()
      
      const shouldShowSuccessNotification = successMessage && (
        // Toujours afficher si c'est un rechargement manuel et l'option est activée
        (showSuccessOnlyOnManualRefetch && isManualRefetch.current) ||
        // Afficher seulement la première fois si l'option est activée
        (showSuccessOnlyOnce && !hasShownSuccessNotification.current) ||
        // Afficher à chaque fois si aucune option n'est activée
        (!showSuccessOnlyOnce && !showSuccessOnlyOnManualRefetch)
      )
      
      if (shouldShowSuccessNotification) {
        showNotification({
          type: 'success',
          message: successMessage,
          duration: 3000,
          priority,
        })
        
        // Marquer que nous avons déjà affiché une notification de succès
        hasShownSuccessNotification.current = true
      }
      
      // Réinitialiser le flag de rechargement manuel
      isManualRefetch.current = false
    }
  }, [isSuccess, data, clearLoadingNotification, successMessage, showNotification, priority, showSuccessOnlyOnce, showSuccessOnlyOnManualRefetch])

  useEffect(() => {
    if (isError && error) {
      clearLoadingNotification()
      showNotification({
        type: 'error',
        message: errorMessage || (error as unknown as Error).message || 'Une erreur est survenue',
        duration: 5000,
        priority: 'high',
        action: retryCount > 0 ? {
          label: 'Réessayer',
          onClick: () => refetch(),
        } : undefined,
      })
    }
  }, [isError, error, clearLoadingNotification, errorMessage, showNotification, retryCount, refetch])

  return result
}

interface CachedMutationOptions<TData, TError, TVariables> extends UseMutationOptions<TData, TError, TVariables> {
  namespace: string
  successMessage?: string
  errorMessage?: string
  priority?: 'high' | 'medium' | 'low'
  invalidateQueries?: boolean
}

export function useCachedMutation<TData, TError = Error, TVariables = void>({
  namespace,
  successMessage,
  errorMessage,
  priority = 'medium',
  invalidateQueries = true,
  ...options
}: CachedMutationOptions<TData, TError, TVariables>) {
  const { showNotification, clearNotification } = useNotification()
  const queryCache = new QueryCache(useQueryClient())
  const notificationId = useRef<string | null>(null)

  return useMutation<TData, TError, TVariables>({
    ...options,
    onMutate: async (variables) => {
      notificationId.current = showNotification({
        type: 'loading',
        message: 'Traitement en cours...',
        priority,
      })
      await options.onMutate?.(variables)
    },
    onSuccess: async (data, variables, context) => {
      if (invalidateQueries) {
        await queryCache.invalidateNamespace(namespace)
      }
      
      if (notificationId.current) {
        clearNotification(notificationId.current)
      }
      
      if (successMessage) {
        showNotification({
          type: 'success',
          message: successMessage,
          duration: 3000,
          priority,
        })
      }
      
      await options.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      if (notificationId.current) {
        clearNotification(notificationId.current)
      }
      
      showNotification({
        type: 'error',
        message: errorMessage || (error as unknown as Error).message || 'Une erreur est survenue',
        duration: 5000,
        priority: 'high',
      })
      
      options.onError?.(error, variables, context)
    },
  })
}
