import { QueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'

/**
 * Crée un résultat de requête simulé pour les tests
 * 
 * @param data Les données à retourner
 * @param options Options supplémentaires pour personnaliser le résultat
 * @returns Un objet simulant le résultat d'un useQuery
 */
export function createMockQueryResult<TData, TError extends null = null>(
  data: TData,
  options: {
    isLoading?: boolean
    isError?: boolean
    error?: TError
    isSuccess?: boolean
    refetch?: () => Promise<any>
  } = {}
): UseQueryResult<TData, TError> {
  // Pour UseQueryResult, isError doit être false
  const isErrorValue = false;
  const isPendingValue = false;
  const isSuccessValue = true;
  
  // Statut doit être 'success' pour UseQueryResult
  const status = 'success' as const;
  
  return {
    data,
    error: null as TError,
    isError: isErrorValue,
    isPending: isPendingValue,
    isSuccess: isSuccessValue,
    status,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: Date.now(),
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isPlaceholderData: false,
    isRefetching: false,
    isStale: false,
    refetch: options.refetch || (() => Promise.resolve({ data })),
    fetchStatus: 'idle',
    isLoadingError: false,
    isRefetchError: false,
    // Propriétés manquantes requises par QueryObserverSuccessResult
    isLoading: false,
    isInitialLoading: false,
    isPaused: false,
    isEnabled: true,
    promise: Promise.resolve(data)
  }
}

/**
 * Crée un client de requête simulé pour les tests
 * 
 * @returns Un QueryClient avec des méthodes espionnées
 */
export function createMockQueryClient(): QueryClient & { 
  invalidateQueries: jest.Mock
  setQueryData: jest.Mock
  getQueryData: jest.Mock
  cancelQueries: jest.Mock
} {
  const queryClient = new QueryClient()
  
  // Espionner les méthodes importantes pour les tests
  queryClient.invalidateQueries = jest.fn()
  queryClient.setQueryData = jest.fn()
  queryClient.getQueryData = jest.fn()
  queryClient.cancelQueries = jest.fn()
  
  return queryClient as any
}

/**
 * Crée un résultat de mutation simulé pour les tests
 * 
 * @param options Options pour personnaliser le comportement de la mutation
 * @returns Un objet simulant le résultat d'un useMutation
 */
export function createMockMutation<TData, TError extends null = null, TVariables = unknown, TContext = unknown>(
  options: {
    mutateAsync?: (variables: TVariables) => Promise<TData>
    mutate?: (variables: TVariables) => void
    isLoading?: boolean
    isError?: boolean
    error?: TError
    isSuccess?: boolean
    data?: TData
    reset?: () => void
  } = {}
): UseMutationResult<TData, TError, TVariables, TContext> {
  // Créer des versions typées des états pour correspondre aux types attendus par UseMutationResult
  // Pour MutationObserverSuccessResult, isError doit être false
  const isErrorValue = false;
  const isPendingValue = false;
  const isSuccessValue = true;
  const isIdleValue = false;
  
  // Statut doit être 'success' pour MutationObserverSuccessResult
  const status = 'success' as const;
  
  return {
    data: options.data as TData,
    error: null as TError,
    isError: isErrorValue,
    isPending: isPendingValue,
    isSuccess: isSuccessValue,
    status,
    failureCount: 0,
    failureReason: null,
    isIdle: isIdleValue,
    isPaused: false,
    submittedAt: Date.now(),
    mutate: options.mutate || jest.fn(),
    mutateAsync: options.mutateAsync || jest.fn().mockResolvedValue(options.data),
    reset: options.reset || jest.fn(),
    variables: undefined as any,
    context: undefined as any
  }
}