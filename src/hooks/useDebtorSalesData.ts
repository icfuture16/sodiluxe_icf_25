import { useQuery } from '@tanstack/react-query'
import { subMonths, startOfDay, endOfDay } from 'date-fns'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { Sale } from '@/types/appwrite.types'
import { useErrorHandler } from './useErrorHandler'

interface DebtorSalesFilters {
  storeId?: string
}

// Hook spécialisé pour les ventes débitrices avec période fixe de 2 mois
export function useDebtorSalesData(filters: DebtorSalesFilters) {
  const { storeId } = filters
  const handleError = useErrorHandler()
  
  // Période fixe de 2 mois
  const calculateFixedDateRange = () => {
    const now = new Date()
    const twoMonthsAgo = subMonths(now, 2)
    
    return {
      startDate: startOfDay(twoMonthsAgo).toISOString(),
      endDate: endOfDay(now).toISOString()
    }
  }

  return useQuery({
    queryKey: ['debtor-sales-data', storeId],
    queryFn: async () => {
      try {
        const { startDate, endDate } = calculateFixedDateRange()
        
        console.log('Fetching debtor sales data with fixed 2-month period:', { startDate, endDate, storeId })
        
        const queries = [
          Query.orderDesc('$createdAt'),
          Query.equal('isCredit', true), // Seulement les ventes à crédit
          Query.greaterThanEqual('$createdAt', startDate),
          Query.lessThanEqual('$createdAt', endDate)
        ]

        if (storeId) {
          queries.push(Query.equal('storeId', storeId))
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SALES,
          queries
        )
        
        // Filtrer les ventes à crédit avec statut non terminé
        const filteredSales = response.documents.filter((sale) => {
          const status = sale.status
          // Inclure seulement les ventes à crédit avec statut différent de 'completed'
          return status !== 'completed'
        })
        
        // Pour chaque vente, récupérer les informations du client, du magasin et du vendeur
        const salesWithRelations = await Promise.all(
          filteredSales.map(async (sale) => {
            try {
              // Récupérer le client
              let client = null
              if (sale.clientId) {
                try {
                  client = await databases.getDocument(
                    DATABASE_ID,
                    COLLECTIONS.CLIENTS,
                    sale.clientId
                  )
                } catch (clientError) {
                  console.error('Erreur lors de la récupération du client:', clientError)
                }
              }
              
              // Récupérer le magasin
              let store = null
              if (sale.storeId) {
                try {
                  store = await databases.getDocument(
                    DATABASE_ID,
                    COLLECTIONS.STORES,
                    sale.storeId
                  )
                } catch (storeError) {
                  console.error('Erreur lors de la récupération du magasin:', storeError)
                }
              }
              
              // Utiliser directement user_seller au lieu de faire des requêtes USERS
              let user = null
              if (sale.user_seller) {
                user = {
                  fullName: sale.user_seller,
                  user_seller: sale.user_seller,
                  $id: sale.sellerId || sale.userId || 'unknown'
                }
              } else {
                // Fallback si user_seller n'est pas disponible
                const userIdToFetch = sale.sellerId || sale.userId
                user = {
                  fullName: userIdToFetch || 'Vendeur inconnu',
                  user_seller: userIdToFetch || 'Vendeur inconnu',
                  $id: userIdToFetch || 'unknown'
                }
              }
              
              return {
                ...sale,
                client,
                store,
                user
              }
            } catch (error) {
              console.error('Erreur lors de la récupération des relations:', error)
              return sale
            }
          })
        )

        console.log('Debtor sales data with relations (2-month period):', salesWithRelations)
        return {
          debtorSales: salesWithRelations as Sale[],
          period: { startDate, endDate },
          totalCount: salesWithRelations.length
        }
      } catch (error) {
        console.error('Unexpected error in useDebtorSalesData:', error)
        handleError(error, 'Impossible de récupérer les données des ventes débitrices')
        throw error
      }
    },
    retry: (failureCount, error) => {
      return failureCount < 3
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })
}