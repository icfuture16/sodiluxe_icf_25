import { useQuery } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { useErrorHandler } from './useErrorHandler'

/**
 * Hook pour récupérer le nombre de ventes par boutique
 * @returns Objet avec le nombre de ventes par storeId
 */
export function useSalesCountByStore() {
  const handleError = useErrorHandler()

  return useQuery({
    queryKey: ['salesCount', 'byStore'],
    queryFn: async () => {
      try {
        console.log('Fetching sales count by store...')
        
        // Récupérer toutes les ventes (directes et à crédit) depuis la collection unifiée
        const salesResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SALES,
          [Query.limit(2000)] // Limite élevée pour récupérer toutes les ventes
        )
        
        // Compter les ventes par boutique
        const salesCountByStore: Record<string, number> = {}
        
        // Compter toutes les ventes (directes et à crédit)
        salesResponse.documents.forEach((sale) => {
          if (sale.storeId) {
            salesCountByStore[sale.storeId] = (salesCountByStore[sale.storeId] || 0) + 1
          }
        })
        
        console.log('Total sales count by store (direct + credit):', salesCountByStore)
        return salesCountByStore
        
      } catch (error: any) {
        handleError(error, 'Impossible de récupérer le nombre de ventes par boutique')
        throw error
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      return failureCount < 3
    },
  })
}

/**
 * Hook pour récupérer le nombre de ventes d'une boutique spécifique
 * @param storeId ID de la boutique
 * @returns Nombre de ventes de la boutique
 */
export function useSalesCountForStore(storeId: string) {
  const { data: salesCountByStore, isLoading, error } = useSalesCountByStore()
  
  return {
    data: salesCountByStore?.[storeId] || 0,
    isLoading,
    error
  }
}