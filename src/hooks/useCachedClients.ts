import { useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { Client, ClientInput, ClientSearchFilters } from '@/types/client.types'
import { useCachedQuery } from './useCachedQuery'

/**
 * Hook pour récupérer et gérer les clients avec gestion du cache et des notifications
 * @param filters - Filtres de recherche pour les clients
 * @returns Données des clients et état de la requête
 */
export function useCachedClients(filters?: Partial<ClientSearchFilters>) {
  // Créer une clé de cache basée sur les filtres
  const filterKey = filters ? JSON.stringify(filters) : 'all';
  
  return useCachedQuery<Client[]>({
    namespace: 'clients',
    key: filterKey,
    queryFn: async () => {
      try {
        const queries = [Query.orderAsc('fullName')];

        // Appliquer les filtres s'ils existent
        if (filters) {
          // La recherche par terme est maintenant gérée côté client pour supporter plusieurs champs
          
          // Filtrer par numéro de téléphone
          if (filters.phoneNumber) {
            queries.push(Query.search('phone', filters.phoneNumber));
          }
          
          // Filtrer par email
          if (filters.email) {
            queries.push(Query.search('email', filters.email));
          }
          
          // Filtrer par magasin préféré
          if (filters.preferredStore) {
            queries.push(Query.equal('preferredStore', filters.preferredStore));
          }
          
          // Filtrer par segment
          if (filters.segment && filters.segment.length > 0) {
            queries.push(Query.equal('segment', filters.segment[0]));
          }
          
          // Le filtre VIP a été supprimé
          
          // Filtrer par plage de dépenses totales
          if (filters.totalSpentRange) {
            if (filters.totalSpentRange.min !== undefined) {
              queries.push(Query.greaterThanEqual('totalSpent', filters.totalSpentRange.min));
            }
            if (filters.totalSpentRange.max !== undefined) {
              queries.push(Query.lessThanEqual('totalSpent', filters.totalSpentRange.max));
            }
          }
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CLIENTS,
          queries
        );

        let clients = response.documents as Client[];
        
        // Filtres côté client pour les cas non supportés par Appwrite Query
        if (filters) {
          // Recherche par terme dans plusieurs champs (nom, email, téléphone, carte de fidélité)
          if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            clients = clients.filter(client => 
              client.fullName?.toLowerCase().includes(searchTerm) ||
              client.email?.toLowerCase().includes(searchTerm) ||
              client.phone?.toLowerCase().includes(searchTerm) ||
              client.loyaltyCardNumber?.toLowerCase().includes(searchTerm)
            );
          }
          
          // Filtrer par plusieurs segments (Appwrite ne supporte pas les OR sur le même champ)
          if (filters.segment && filters.segment.length > 1) {
            clients = clients.filter(client => 
              filters.segment?.includes(client.segment)
            );
          }
          
          // Filtrer par plage de date de dernier achat
          if (filters.lastPurchaseRange) {
            clients = clients.filter(client => {
              if (!client.lastPurchase) return false;
              
              const purchaseDate = new Date(client.lastPurchase);
              const fromDate = filters.lastPurchaseRange?.from;
              const toDate = filters.lastPurchaseRange?.to;
              
              if (fromDate && toDate) {
                return purchaseDate >= fromDate && purchaseDate <= toDate;
              } else if (fromDate) {
                return purchaseDate >= fromDate;
              } else if (toDate) {
                return purchaseDate <= toDate;
              }
              
              return true;
            });
          }
          
          // Filtrer par tags
          if (filters.tags && filters.tags.length > 0) {
            clients = clients.filter(client => 
              client.tags?.some(tag => filters.tags?.includes(tag))
            );
          }
        }

        return clients;
      } catch (error: unknown) {
        const appwriteError = error as import('@/types/appwrite.types').AppwriteException;
        if (appwriteError.code === 404) {
          console.error('Collection clients non trouvée:', appwriteError)
          throw new Error('La collection clients n\'existe pas')
        } else if (appwriteError.code === 401) {
          console.error('Erreur d\'authentification:', appwriteError)
          throw new Error('Vous n\'êtes pas autorisé à accéder aux clients')
        } else {
          console.error('Erreur lors du chargement des clients:', appwriteError)
          throw error
        }
      }
    },
    successMessage: 'Clients chargés avec succès',
    errorMessage: 'Erreur lors du chargement des clients',
    retryCount: 2,
    priority: 'medium',
    showSuccessOnlyOnce: true,
    showSuccessOnlyOnManualRefetch: true,
    useSubtleLoadingIndicator: true,
  })
}

/**
 * Hook pour créer un nouveau client avec gestion du cache
 * @returns Mutation pour créer un client
 */
export function useCreateCachedClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newClient: ClientInput) => {
      try {
        // Générer un numéro de carte de fidélité unique
        const generateLoyaltyCardNumber = () => {
          const timestamp = Date.now().toString().slice(-6)
          const random = Math.random().toString(36).substring(2, 6).toUpperCase()
          return `${timestamp.substring(0, 4)}-${random}`
        }

        // Définir des valeurs par défaut pour les nouveaux champs
        const clientWithDefaults = {
          ...newClient,
          segment: newClient.segment || 'bronze',
          vipStatus: newClient.vipStatus || false,
          loyaltyPoints: newClient.loyaltyPoints || 0,
          totalSpent: newClient.totalSpent || 0,
          loyaltyCardNumber: newClient.loyaltyCardNumber || generateLoyaltyCardNumber(),
        }
        
        const data = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.CLIENTS,
          'unique()',
          clientWithDefaults
        )

        return data as Client
      } catch (error: any) {
        if (error.code === 409) {
          console.error('Client déjà existant:', error)
          throw new Error('Un client avec cet email existe déjà')
        } else {
          console.error('Erreur lors de la création du client:', error)
          throw error
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

/**
 * Hook pour mettre à jour un client existant avec gestion du cache
 * @returns Mutation pour mettre à jour un client
 */
export function useUpdateCachedClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<ClientInput>
    }) => {
      try {
        const data = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.CLIENTS,
          id,
          updates
        )

        return data as Client
      } catch (error: any) {
        if (error.code === 404) {
          console.error('Client non trouvé:', error)
          throw new Error('Le client demandé n\'existe pas')
        } else {
          console.error('Erreur lors de la mise à jour du client:', error)
          throw error
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

/**
 * Hook pour supprimer un client avec gestion du cache
 * @returns Mutation pour supprimer un client
 */
export function useDeleteCachedClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.CLIENTS,
          id
        )

        return id
      } catch (error: any) {
        if (error.code === 404) {
          console.error('Client non trouvé:', error)
          throw new Error('Le client demandé n\'existe pas')
        } else {
          console.error('Erreur lors de la suppression du client:', error)
          throw error
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

/**
 * Hook pour récupérer les statistiques des clients
 * @returns Données des statistiques et état de la requête
 */
export function useClientAnalytics() {
  return useCachedQuery({
    namespace: 'clientAnalytics',
    key: 'overview',
    queryFn: async () => {
      try {
        // Récupérer tous les clients
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CLIENTS,
          []
        )

        const clients = response.documents as Client[]
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        // Calculer les statistiques
        const analytics = {
          overview: {
            totalClients: clients.length,
            newClientsThisMonth: clients.filter(client => {
              const createdAt = new Date(client.$createdAt)
              return createdAt >= firstDayOfMonth
            }).length,
            recentClients: clients.filter(client => {
              if (!client.lastPurchase) return false
              const lastPurchase = new Date(client.lastPurchase)
              const oneMonthAgo = new Date()
              oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
              return lastPurchase >= oneMonthAgo
            }).length,
            churnRate: 0, // À calculer si les données sont disponibles
            averageClv: clients.length > 0 
              ? clients.reduce((sum, client) => sum + client.totalSpent, 0) / clients.length 
              : 0,
          },
          
          segmentation: {
            premium: { 
              count: clients.filter(client => client.segment === 'premium').length,
              revenue: clients.filter(client => client.segment === 'premium')
                .reduce((sum, client) => sum + client.totalSpent, 0)
            },
            gold: { 
              count: clients.filter(client => client.segment === 'gold').length,
              revenue: clients.filter(client => client.segment === 'gold')
                .reduce((sum, client) => sum + client.totalSpent, 0)
            },
            silver: { 
              count: clients.filter(client => client.segment === 'silver').length,
              revenue: clients.filter(client => client.segment === 'silver')
                .reduce((sum, client) => sum + client.totalSpent, 0)
            },
            bronze: { 
              count: clients.filter(client => client.segment === 'bronze').length,
              revenue: clients.filter(client => client.segment === 'bronze')
                .reduce((sum, client) => sum + client.totalSpent, 0)
            },
          },
          
          trends: {
            acquisitionTrend: [], // À implémenter avec des données réelles
            retentionTrend: [],  // À implémenter avec des données réelles
            clvTrend: [],        // À implémenter avec des données réelles
          },
          
          // Top clients par dépenses
          topClients: [...clients]
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 5),
            
          // Clients à risque (pas d'achat depuis longtemps ET valeur faible)
          riskClients: clients
            .filter(client => {
              // Exclure les clients qui sont dans le top 5 des dépenses
              const topClientIds = [...clients]
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 5)
                .map(c => c.$id)
              
              if (topClientIds.includes(client.$id)) return false
              
              // Si le client n'a jamais acheté ET n'a pas de dépenses, il n'est pas à risque (nouveau client)
              if (!client.lastPurchase && client.totalSpent === 0) return false
              
              // Si le client a des dépenses mais pas de lastPurchase (données incohérentes), considérer comme à risque
              if (!client.lastPurchase && client.totalSpent > 0) return client.totalSpent < 50000
              
              // Si le client a un lastPurchase, vérifier s'il est ancien
              if (!client.lastPurchase) return false // Déjà géré plus haut
              const lastPurchase = new Date(client.lastPurchase)
              const sixMonthsAgo = new Date()
              sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
              return lastPurchase < sixMonthsAgo && client.totalSpent < 100000 // Seuil de 100k FCFA
            })
            .sort((a, b) => {
              // Trier par ancienneté du dernier achat (plus ancien en premier)
              if (!a.lastPurchase && !b.lastPurchase) return 0
              if (!a.lastPurchase) return -1
              if (!b.lastPurchase) return 1
              return new Date(a.lastPurchase).getTime() - new Date(b.lastPurchase).getTime()
            })
            .slice(0, 5),
        }
        
        return analytics
      } catch (error: unknown) {
        console.error('Erreur lors du chargement des statistiques clients:', error)
        throw error
      }
    },
    successMessage: 'Statistiques clients chargées avec succès',
    errorMessage: 'Erreur lors du chargement des statistiques clients',
    retryCount: 1,
    priority: 'low',
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}