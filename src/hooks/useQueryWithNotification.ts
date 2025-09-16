import { useQuery, useMutation, UseQueryOptions, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { useNotification } from '@/components/feedback/NotificationContainer'
import { useEffect } from 'react'

export function useQueryWithNotification<TData, TError>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> & {
    successMessage?: string
    errorMessage?: string
  }
): UseQueryResult<TData, TError> {
  const { showNotification } = useNotification()
  const { successMessage, errorMessage, ...queryOptions } = options || {}

  const result = useQuery<TData, TError>({
    queryKey,
    queryFn,
    ...queryOptions,
  })

  const { data, error, isSuccess, isError } = result

  useEffect(() => {
    if (isSuccess && data && successMessage) {
      showNotification({
        type: 'success',
        message: successMessage,
        duration: 3000,
      })
    }
  }, [isSuccess, data, successMessage, showNotification])

  useEffect(() => {
    if (isError && error) {
      showNotification({
        type: 'error',
        message: errorMessage || (error as unknown as Error).message || 'Une erreur est survenue',
        duration: 5000,
      })
    }
  }, [isError, error, errorMessage, showNotification])

  return result
}

export function useMutationWithNotification<TData, TError, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    successMessage?: string
    errorMessage?: string
  }
): UseMutationResult<TData, TError, TVariables> {
  const { showNotification } = useNotification()
  const { successMessage, errorMessage } = options || {}

  const result = useMutation<TData, TError, TVariables>({
    mutationFn,
  })

  const { data, error, isSuccess, isError } = result

  useEffect(() => {
    if (isSuccess && data && successMessage) {
      showNotification({
        type: 'success',
        message: successMessage,
        duration: 3000,
      })
    }
  }, [isSuccess, data, successMessage, showNotification])

  useEffect(() => {
    if (isError && error) {
      showNotification({
        type: 'error',
        message: errorMessage || (error as unknown as Error).message || 'Une erreur est survenue',
        duration: 5000,
      })
    }
  }, [isError, error, errorMessage, showNotification])

  return result
}

