import { useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { Sale, SaleItem, User } from '@/types/appwrite.types'
import { useCachedQuery } from './useCachedQuery'
import { generateUserSeller } from '@/lib/utils/sellerUtils'

interface SaleFilters {
  store_id?: string
  start_date?: string
  end_date?: string
  user_id?: string
  client_id?: string
  status?: 'pending' | 'completed' | 'cancelled'
}

/**
 * Hook pour récupérer et gérer les ventes avec gestion du cache et des notifications
 * @param filters - Filtres optionnels pour les ventes
 * @returns Données des ventes et état de la requête
 */
export function useCachedSales(filters: SaleFilters = {}) {
  const filterKey = JSON.stringify(filters)
  
  return useCachedQuery<Sale[]>({
    namespace: 'sales',
    key: filterKey,
    queryFn: async () => {
      try {
        const queries = [Query.orderDesc('$createdAt')]

        if (filters.store_id) {
          queries.push(Query.equal('storeId', filters.store_id))
        }

        if (filters.user_id) {
          queries.push(Query.equal('userId', filters.user_id))
        }

        if (filters.client_id) {
          queries.push(Query.equal('clientId', filters.client_id))
        }

        if (filters.status) {
          queries.push(Query.equal('status', filters.status))
        }

        if (filters.start_date) {
          queries.push(Query.greaterThanEqual('$createdAt', filters.start_date))
        }

        if (filters.end_date) {
          queries.push(Query.lessThanEqual('$createdAt', filters.end_date))
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SALES,
          queries
        )

        return response.documents as Sale[]
      } catch (error: any) {
        if (error.code === 404) {
          console.error('Collection ventes non trouvée:', error)
          throw new Error('La collection ventes n\'existe pas')
        } else if (error.code === 401) {
          console.error('Erreur d\'authentification:', error)
          throw new Error('Vous n\'êtes pas autorisé à accéder aux ventes')
        } else {
          console.error('Erreur lors du chargement des ventes:', error)
          throw error
        }
      }
    },
    successMessage: 'Ventes chargées avec succès',
    errorMessage: 'Erreur lors du chargement des ventes',
    retryCount: 2,
    priority: 'medium',
  })
}

interface CreateSaleInput {
  sale: Omit<Sale, '$id' | '$createdAt' | '$updatedAt'>
  items: Array<Omit<SaleItem, '$id' | '$createdAt' | '$updatedAt' | 'saleId'>>
}

/**
 * Hook pour créer une nouvelle vente avec ses articles associés
 * @returns Mutation pour créer une vente
 */
export function useCreateCachedSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sale, items }: CreateSaleInput) => {
      try {
        // Récupérer les informations du vendeur pour générer user_seller et récupérer le storeId
        let userSeller = 'UNKNOWN'
        let autoStoreId = sale.storeId // Utiliser le storeId fourni par défaut
        
        if (sale.userId) {
          try {
            const user = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.USERS,
              sale.userId
            ) as User
            
            console.log(`[DEBUG] Vendeur récupéré (cached):`, { id: user.$id, fullName: user.fullName, storeId: user.storeId })
            
            // Générer user_seller
            if (user.fullName) {
              userSeller = generateUserSeller(user.fullName)
              console.log(`[DEBUG] user_seller généré (cached): ${userSeller} pour ${user.fullName}`)
            }
            
            // Récupérer automatiquement le storeId si non fourni
            if (!sale.storeId && user.storeId) {
              autoStoreId = user.storeId
              console.log(`[DEBUG] storeId récupéré automatiquement (cached): '${autoStoreId}' pour le vendeur '${user.fullName}'`)
            } else if (sale.storeId) {
              console.log(`[DEBUG] storeId fourni manuellement (cached): '${sale.storeId}'`)
            } else {
              console.warn(`[WARNING] Aucun storeId disponible pour le vendeur ${sale.userId} (cached)`)
            }
          } catch (userError) {
            console.warn(`[WARNING] Impossible de récupérer le vendeur ${sale.userId}:`, userError)
          }
        }

        // Préparer les données de vente avec user_seller et storeId automatique
        const saleWithEnhancements = {
          ...sale,
          user_seller: userSeller,
          storeId: autoStoreId
        }
        
        console.log(`[DEBUG] Données de vente finales (cached):`, { 
          userId: saleWithEnhancements.userId, 
          user_seller: saleWithEnhancements.user_seller, 
          storeId: saleWithEnhancements.storeId 
        })

        // Créer la vente
        const createdSale = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.SALES,
          'unique()',
          saleWithEnhancements
        ) as Sale

        // Créer les articles de vente
        const saleItems = await Promise.all(
          items.map(item =>
            databases.createDocument(
              DATABASE_ID,
              COLLECTIONS.SALE_ITEMS,
              'unique()',
              {
                ...item,
                saleId: createdSale.$id,
              }
            )
          )
        )

        return {
          sale: createdSale,
          items: saleItems as SaleItem[],
        }
      } catch (error: any) {
        console.error('Erreur lors de la création de la vente:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

/**
 * Hook pour mettre à jour le statut d'une vente existante
 * @returns Mutation pour mettre à jour une vente
 */
export function useUpdateCachedSaleStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: 'pending' | 'completed' | 'cancelled'
    }) => {
      try {
        const data = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.SALES,
          id,
          { status }
        )

        return data as Sale
      } catch (error: any) {
        if (error.code === 404) {
          console.error('Vente non trouvée:', error)
          throw new Error('La vente demandée n\'existe pas')
        } else {
          console.error('Erreur lors de la mise à jour de la vente:', error)
          throw error
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}