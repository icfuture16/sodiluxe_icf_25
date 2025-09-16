import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { Sale, SaleInput, SaleItemInput, User } from '@/types/appwrite.types'
import { useErrorHandler } from './useErrorHandler'
import { generateUserSeller } from '@/lib/utils/sellerUtils'
import { useCalculateLoyaltyPoints } from './useLoyaltyHistory'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'

export function useSales(filters?: {
  store_id?: string
  start_date?: string
  end_date?: string
  user_id?: string
  isCredit?: boolean // Nouveau paramètre pour filtrer par type de vente
}) {
  const handleError = useErrorHandler()

  return useQuery({
    queryKey: ['sales', filters],
    queryFn: async () => {
      try {

        console.log('Fetching sales...')
        const queries = [Query.orderDesc('$createdAt')]

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

        // Filtrer par type de vente (normale ou à crédit)
        if (filters?.isCredit !== undefined) {
          queries.push(Query.equal('isCredit', filters.isCredit))
        }

        // Récupérer les ventes avec les relations
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
              
              // Récupérer les informations du vendeur
              let user = null
              const userIdToFetch = sale.sellerId || sale.userId
              
              if (userIdToFetch) {
                try {
                  user = await databases.getDocument(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    userIdToFetch
                  )
                  console.log(`[DEBUG] Vendeur récupéré pour sale ${sale.$id}:`, user.fullName)
                } catch (userError) {
                  if ((userError as { code: number }).code === 404) {
                    console.warn(`[WARNING] Vendeur ${userIdToFetch} introuvable pour sale ${sale.$id}, tentative de recherche par email...`)
                    
                    // Tentative de recherche par email si l'ID ressemble à un email
                    if (userIdToFetch.includes('@')) {
                      try {
                        const userByEmailResponse = await databases.listDocuments(
                          DATABASE_ID,
                          COLLECTIONS.USERS,
                          [Query.equal('email', userIdToFetch)]
                        )
                        
                        if (userByEmailResponse.documents.length > 0) {
                          user = userByEmailResponse.documents[0] as User
                          console.log(`[SUCCESS] Vendeur trouvé par email pour sale ${sale.$id}:`, user.fullName)
                        } else {
                          console.warn(`[WARNING] Aucun vendeur trouvé avec l'email ${userIdToFetch}`)
                          // Générer un user_seller basé sur l'email
                          const emailName = userIdToFetch.split('@')[0]
                          const userSeller = generateUserSeller(emailName)
                          user = {
                            fullName: emailName,
                            user_seller: userSeller,
                            $id: userIdToFetch
                          }
                        }
                      } catch (emailSearchError) {
                        console.error(`[ERROR] Erreur lors de la recherche par email:`, emailSearchError)
                        user = {
                          fullName: 'Vendeur inconnu',
                          $id: userIdToFetch
                        }
                      }
                    } else {
                      // Générer un user_seller basé sur l'ID tronqué
                      const truncatedId = userIdToFetch.substring(0, 8)
                      const userSeller = generateUserSeller(truncatedId)
                      user = {
                        fullName: 'Vendeur inconnu',
                        user_seller: userSeller,
                        $id: userIdToFetch
                      }
                    }
                  } else {
                    console.error(`[ERROR] Erreur lors de la récupération du vendeur ${userIdToFetch}:`, userError)
                    user = {
                      fullName: 'Vendeur inconnu',
                      $id: userIdToFetch
                    }
                  }
                }
              } else {
                console.log(`[DEBUG] Aucun ID de vendeur pour sale ${sale.$id}`)
              }
              
              // Retourner la vente avec ses relations
              const saleWithRelations = {
                ...sale,
                client,
                store,
                user
              }
              console.log(`[DEBUG] Sale finale ${sale.$id} avec relations:`, {
                id: sale.$id,
                userId: sale.userId,
                user: user ? { id: user.$id, fullName: user.fullName } : null
              })
              return saleWithRelations
            } catch (error) {
              console.error('Erreur lors de la récupération des relations:', error)
              return sale
            }
          })
        )

        console.log('Sales data with relations:', salesWithRelations)
        return salesWithRelations as Sale[]
      } catch (error) {
        console.error('Unexpected error:', error)
        handleError(error, 'Impossible de récupérer les ventes')
        throw error
      }
    },
    // Toujours retenter en cas d'échec
    retry: (failureCount, error) => {
      return failureCount < 3
    },
  })
}

/**
 * Hook pour supprimer une vente (réservé aux administrateurs)
 */
export function useDeleteSale() {
  const queryClient = useQueryClient()
  const handleError = useErrorHandler()

  return useMutation({
    mutationFn: async (saleId: string) => {
      try {
        // Supprimer d'abord les éléments de vente associés
        const saleItemsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SALE_ITEMS,
          [Query.equal('saleId', saleId)]
        )

        // Supprimer tous les éléments de vente
        for (const item of saleItemsResponse.documents) {
          await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.SALE_ITEMS,
            item.$id
          )
        }

        // Supprimer la vente elle-même
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.SALES,
          saleId
        )

        console.log(`Vente ${saleId} supprimée avec succès`)
        return saleId
      } catch (error) {
        console.error('Erreur lors de la suppression de la vente:', error)
        handleError(error, 'Impossible de supprimer la vente')
        throw error
      }
    },
    onSuccess: () => {
      // Invalider toutes les requêtes liées aux ventes
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['normal-sales'] })
      queryClient.invalidateQueries({ queryKey: ['credit-sales'] })
    },
  })
}

/**
 * Hook pour supprimer plusieurs ventes en une fois (réservé aux administrateurs)
 */
export function useDeleteMultipleSales() {
  const queryClient = useQueryClient()
  const handleError = useErrorHandler()

  return useMutation({
    mutationFn: async (saleIds: string[]) => {
      try {
        const results = []
        const errors = []

        for (const saleId of saleIds) {
          try {
            // Supprimer d'abord les éléments de vente associés
            const saleItemsResponse = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.SALE_ITEMS,
              [Query.equal('saleId', saleId)]
            )

            // Supprimer tous les éléments de vente
            for (const item of saleItemsResponse.documents) {
              await databases.deleteDocument(
                DATABASE_ID,
                COLLECTIONS.SALE_ITEMS,
                item.$id
              )
            }

            // Supprimer la vente elle-même
            await databases.deleteDocument(
              DATABASE_ID,
              COLLECTIONS.SALES,
              saleId
            )

            results.push(saleId)
            console.log(`Vente ${saleId} supprimée avec succès`)
          } catch (error) {
            console.error(`Erreur lors de la suppression de la vente ${saleId}:`, error)
            errors.push({ saleId, error })
          }
        }

        if (errors.length > 0) {
          console.warn(`${errors.length} vente(s) n'ont pas pu être supprimée(s)`)
          // Si certaines suppressions ont échoué, on lance une erreur avec les détails
          if (results.length === 0) {
            throw new Error('Aucune vente n\'a pu être supprimée')
          } else {
            console.log(`${results.length} vente(s) supprimée(s) avec succès, ${errors.length} échec(s)`)
          }
        }

        return { 
          success: results, 
          errors,
          successCount: results.length,
          errorCount: errors.length
        }
      } catch (error) {
        console.error('Erreur lors de la suppression multiple des ventes:', error)
        handleError(error, 'Impossible de supprimer les ventes sélectionnées')
        throw error
      }
    },
    onSuccess: () => {
      // Invalider toutes les requêtes liées aux ventes
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['normal-sales'] })
      queryClient.invalidateQueries({ queryKey: ['credit-sales'] })
    },
  })
}

type CreateSaleParams = {
  sale: SaleInput
  items: SaleItemInput[]
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  const handleError = useErrorHandler()
  const calculateLoyaltyPoints = useCalculateLoyaltyPoints()
  const { settings } = useSystemSettings()

  return useMutation({
    mutationFn: async ({ sale, items }: CreateSaleParams) => {
      try {
        // Récupérer les informations du vendeur pour générer user_seller et récupérer le storeId
        let userSeller = 'UNKNOWN'
        let autoStoreId = sale.storeId // Utiliser le storeId fourni par défaut
        
        if (sale.userId) {
          try {
            console.log(`[DEBUG] Tentative de récupération du vendeur avec ID: ${sale.userId}`)
            const dbUser = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.USERS,
              sale.userId
            ) as User
            
            console.log(`[DEBUG] Vendeur récupéré:`, { id: dbUser.$id, fullName: dbUser.fullName, email: dbUser.email, storeId: dbUser.storeId })
            
            // Générer user_seller
            if (dbUser.fullName && dbUser.fullName.trim() !== '') {
              userSeller = generateUserSeller(dbUser.fullName)
              console.log(`[DEBUG] user_seller généré: '${userSeller}' pour '${dbUser.fullName}'`)
            } else {
              console.warn(`[WARNING] fullName vide ou invalide pour le vendeur ${sale.userId}:`, dbUser.fullName)
              userSeller = `USER_${sale.userId.substring(0, 6)}`
              console.log(`[DEBUG] Utilisation du fallback user_seller basé sur l'ID: '${userSeller}'`)
            }
            
            // Récupérer automatiquement le storeId si non fourni
            if (!sale.storeId && dbUser.storeId) {
              autoStoreId = dbUser.storeId
              console.log(`[DEBUG] storeId récupéré automatiquement: '${autoStoreId}' pour le vendeur '${dbUser.fullName}'`)
            } else if (sale.storeId) {
              console.log(`[DEBUG] storeId fourni manuellement: '${sale.storeId}'`)
            } else {
              console.warn(`[WARNING] Aucun storeId disponible pour le vendeur ${sale.userId}`)
            }
          } catch (dbError) {
            console.error(`[ERROR] Impossible de récupérer le vendeur ${sale.userId}:`, dbError)
            
            // Tentative de recherche par email comme fallback
            try {
              console.log(`[DEBUG] Tentative de recherche du vendeur par email pour l'ID: ${sale.userId}`)
              const authUser = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USERS,
                [Query.equal('$id', sale.userId)]
              )
              
              if (authUser.documents.length > 0) {
                const foundUser = authUser.documents[0] as User
                console.log(`[DEBUG] Utilisateur trouvé par recherche:`, { id: foundUser.$id, fullName: foundUser.fullName, email: foundUser.email })
                
                if (foundUser.fullName && foundUser.fullName.trim() !== '') {
                  userSeller = generateUserSeller(foundUser.fullName)
                  console.log(`[DEBUG] user_seller généré depuis la recherche: '${userSeller}' pour '${foundUser.fullName}'`)
                } else {
                  userSeller = `USER_${sale.userId.substring(0, 6)}`
                  console.log(`[DEBUG] Utilisation du fallback user_seller depuis la recherche: '${userSeller}'`)
                }
              } else {
                console.log(`[DEBUG] Aucun utilisateur trouvé par recherche pour l'ID: ${sale.userId}`)
                userSeller = `USER_${sale.userId.substring(0, 6)}`
                console.log(`[DEBUG] Utilisation du fallback user_seller final: '${userSeller}' pour l'utilisateur introuvable ${sale.userId}`)
              }
            } catch (searchError) {
              console.error(`[ERROR] Erreur lors de la recherche de l'utilisateur:`, searchError)
              userSeller = `USER_${sale.userId.substring(0, 6)}`
              console.log(`[DEBUG] Utilisation du fallback user_seller après erreur de recherche: '${userSeller}' pour l'utilisateur ${sale.userId}`)
            }
          }
        } else {
          console.error(`[ERROR] Aucun userId fourni dans les données de vente`)
        }

        // Préparer les données de vente avec user_seller et storeId automatique
        const truncatedUserSeller = userSeller.substring(0, 9)
        console.log(`[DEBUG] user_seller tronqué de '${userSeller}' à '${truncatedUserSeller}' pour compatibilité DB`)
        
        const saleWithEnhancements = {
          ...sale,
          user_seller: truncatedUserSeller,
          storeId: autoStoreId // Utiliser le storeId automatique ou fourni
        }
        
        console.log(`[DEBUG] Données de vente finales:`, { 
          userId: saleWithEnhancements.userId, 
          user_seller: saleWithEnhancements.user_seller, 
          storeId: saleWithEnhancements.storeId 
        })

        // Insert sale
        const saleData = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.SALES,
          'unique()',
          saleWithEnhancements
        )

        // Insert sale items
        const saleItems = items.map((item) => ({
          ...item,
          saleId: saleData.$id,
        }))

        for (const item of saleItems) {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.SALE_ITEMS,
            'unique()',
            item
          )
        }

        // Déduction automatique du stock pour chaque produit vendu
        for (const item of saleItems) {
          try {
            // Récupérer le produit actuel pour obtenir le stock
            const currentProduct = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.PRODUCTS,
              item.productId
            )
            
            // Calculer le nouveau stock
            const newStockQuantity = Math.max(0, (currentProduct.stockQuantity || 0) - item.quantity)
            
            // Mettre à jour le stock du produit
            await databases.updateDocument(
              DATABASE_ID,
              COLLECTIONS.PRODUCTS,
              item.productId,
              { stockQuantity: newStockQuantity }
            )
            
            console.log(`Stock mis à jour pour le produit ${item.productId}: ${currentProduct.stockQuantity} -> ${newStockQuantity}`)
          } catch (stockError) {
            console.error(`Erreur lors de la mise à jour du stock pour le produit ${item.productId}:`, stockError)
            // Ne pas faire échouer la vente si la mise à jour du stock échoue
          }
        }

        // Calculer et attribuer les points de fidélité si un client est associé
        if (saleWithEnhancements.clientId && saleWithEnhancements.totalAmount > 0) {
          try {
            await calculateLoyaltyPoints.mutateAsync({
              clientId: saleWithEnhancements.clientId,
              saleAmount: saleWithEnhancements.totalAmount,
              saleId: saleData.$id,
              storeId: saleWithEnhancements.storeId,
              loyaltyPointsRate: settings.loyaltyPointsRate
            })
            
            console.log(`Points de fidélité calculés pour la vente ${saleData.$id}`)
          } catch (loyaltyError) {
            console.error('Erreur lors du calcul des points de fidélité:', loyaltyError)
            // Ne pas faire échouer la vente si le calcul des points échoue
          }
        }

        return saleData as Sale
      } catch (error) {
        console.error('Unexpected error:', error)
        handleError(error, 'Impossible de créer la vente')
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

// Hooks spécialisés pour la compatibilité

/**
 * Hook pour récupérer les ventes normales (non crédit) et les ventes à crédit entièrement payées
 */
export function useNormalSales(filters?: {
  store_id?: string
  start_date?: string
  end_date?: string
  user_id?: string
}) {
  const handleError = useErrorHandler()

  return useQuery({
    queryKey: ['normal-sales', filters],
    queryFn: async () => {
      try {
        console.log('Fetching normal sales...')
        const queries = [Query.orderDesc('$createdAt')]

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

        // Récupérer toutes les ventes pour filtrer côté client
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SALES,
          queries
        )
        
        // Filtrer les ventes selon la logique métier
        const filteredSales = response.documents.filter((sale) => {
          // Inclure les ventes directes (non crédit) ET les ventes à crédit avec statut 'completed'
          return !sale.isCredit || (sale.isCredit && sale.status === 'completed')
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

        console.log('Normal sales data with relations:', salesWithRelations)
        return salesWithRelations as Sale[]
      } catch (error) {
        console.error('Unexpected error:', error)
        handleError(error, 'Impossible de récupérer les ventes normales')
        throw error
      }
    },
    retry: (failureCount, error) => {
      return failureCount < 3
    },
  })
}

/**
 * Hook pour récupérer uniquement les ventes à crédit non entièrement payées
 */
export function useCreditSales(filters?: {
  store_id?: string
  start_date?: string
  end_date?: string
  user_id?: string
}) {
  const handleError = useErrorHandler()

  return useQuery({
    queryKey: ['credit-sales', filters],
    queryFn: async () => {
      try {
        console.log('Fetching credit sales...')
        const queries = [
          Query.orderDesc('$createdAt'),
          Query.equal('isCredit', true) // Seulement les ventes à crédit
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

        console.log('Credit sales data with relations:', salesWithRelations)
        return salesWithRelations as Sale[]
      } catch (error) {
        console.error('Unexpected error:', error)
        handleError(error, 'Impossible de récupérer les ventes à crédit')
        throw error
      }
    },
    retry: (failureCount, error) => {
      return failureCount < 3
    },
  })
}

/**
 * Hook pour récupérer une vente spécifique (normale ou crédit)
 */
export function useSale(saleId: string) {
  const handleError = useErrorHandler()

  return useQuery({
    queryKey: ['sale', saleId],
    queryFn: async () => {
      try {
        const sale = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.SALES,
          saleId
        )

        // Enrichir avec les relations comme dans useSales
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

        // First cast to unknown then to Sale to handle type conversion safely
        return {
          ...sale,
          clientId: sale.clientId,
          storeId: sale.storeId,
          userId: sale.userId,
          user_seller: sale.user_seller,
          client,
          store,
          user
        } as unknown as Sale
      } catch (error) {
        console.error('Erreur lors de la récupération de la vente:', error)
        handleError(error, 'Impossible de récupérer la vente')
        throw error
      }
    },
    enabled: !!saleId,
    retry: (failureCount, error) => {
      return failureCount < 3
    },
  })
}

