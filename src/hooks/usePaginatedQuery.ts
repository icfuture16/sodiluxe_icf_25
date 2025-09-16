import { useCallback, useState } from 'react'
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query'

type PaginationState = {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

type PaginatedResult<T> = {
  data: T[]
  pagination: PaginationState
}

type PaginatedQueryOptions<T> = {
  queryKey: unknown[]
  queryFn: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>
  initialPage?: number
  initialPageSize?: number
  options?: Omit<UseQueryOptions<PaginatedResult<T>, Error>, 'queryKey' | 'queryFn'>
}

/**
 * Hook pour gérer les requêtes paginées
 * Fournit des fonctionnalités de pagination avec des contrôles de navigation
 */
export function usePaginatedQuery<T>({ 
  queryKey, 
  queryFn, 
  initialPage = 1, 
  initialPageSize = 10,
  options = {}
}: PaginatedQueryOptions<T>): UseQueryResult<PaginatedResult<T>, Error> & {
  pagination: PaginationState
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setPageSize: (size: number) => void
} {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  // Fonction pour récupérer les données paginées
  const fetchPaginatedData = useCallback(async () => {
    const result = await queryFn(page, pageSize)
    
    const totalPages = Math.ceil(result.total / pageSize)
    
    return {
      data: result.data,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: result.total,
        totalPages
      }
    }
  }, [queryFn, page, pageSize])

  // Utiliser useQuery pour récupérer les données
  const queryResult = useQuery<PaginatedResult<T>, Error>({
    queryKey: [...queryKey, { page, pageSize }],
    queryFn: fetchPaginatedData,
    ...options
  })

  // Fonctions de navigation
  const goToPage = useCallback((newPage: number) => {
    const totalPages = queryResult.data?.pagination.totalPages || 1
    const validPage = Math.max(1, Math.min(newPage, totalPages))
    setPage(validPage)
  }, [queryResult.data?.pagination.totalPages])

  const nextPage = useCallback(() => {
    const totalPages = queryResult.data?.pagination.totalPages || 1
    if (page < totalPages) {
      setPage(prev => prev + 1)
    }
  }, [page, queryResult.data?.pagination.totalPages])

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1)
    }
  }, [page])

  // Fonction pour changer la taille de la page
  const changePageSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1) // Revenir à la première page lors du changement de taille
  }, [])

  return {
    ...queryResult,
    pagination: queryResult.data?.pagination || {
      currentPage: page,
      pageSize,
      totalItems: 0,
      totalPages: 1
    },
    goToPage,
    nextPage,
    prevPage,
    setPageSize: changePageSize
  }
}

