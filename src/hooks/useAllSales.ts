import { useQuery } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { Sale } from '@/types/appwrite.types'
import { useErrorHandler } from './useErrorHandler'

/**
 * Hook pour récupérer toutes les ventes (normales et à crédit) combinées
 */
export function useAllSales(filters?: {
  store_id?: string
  start_date?: string
  end_date?: string
  user_id?: string
}) {
  const handleError = useErrorHandler()

  return useQuery({
    queryKey: ['all-sales', filters],
    queryFn: async () => {
      try {
        console.log('Fetching all sales (normal + credit)...')
        const queries = [
          Query.orderDesc('$createdAt'),
          Query.limit(2000) // Limite raisonnable
        ]

        if (filters?.store_id) {
          queries.push(Query.equal('storeId', filters.store_id))
        }

        if (filters?.start_date) {
          queries.push(Query.greaterThanEqual('$createdAt', filters.start_date))
        }

        if (filters?.end_date) {
          queries.push(Query.lessThanEqual('$createdAt', filters.end_date))
        }

        if (filters?.user_id) {
          queries.push(Query.equal('userId', filters.user_id))
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SALES,
          queries
        )
        
        // Pour chaque vente, récupérer les informations du client, du magasin et du vendeur
        const salesWithRelations = await Promise.all(
          response.documents.map(async (sale) => {
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

        console.log('All sales data with relations:', salesWithRelations)
        return salesWithRelations as Sale[]
      } catch (error) {
        console.error('Unexpected error:', error)
        handleError(error, 'Impossible de récupérer toutes les ventes')
        throw error
      }
    },
    retry: (failureCount, error) => {
      return failureCount < 3
    },
    staleTime: 30 * 1000, // 30 secondes - rafraîchissement quasi temps réel
    refetchInterval: 2 * 60 * 1000, // 2 minutes - mise à jour fréquente
    refetchOnWindowFocus: true, // Rafraîchissement au focus de la fenêtre
  })
}

