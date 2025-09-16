import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { AfterSalesService, AfterSalesServiceInput } from '@/types/appwrite.types'
import { useErrorHandler } from './useErrorHandler'

/**
 * Hook pour récupérer et gérer les demandes de service après-vente
 * @param query - Terme de recherche optionnel pour filtrer les demandes
 * @param status - Filtre optionnel par statut
 * @returns Données des demandes SAV et état de la requête
 */
export function useAfterSalesService(query?: string, status?: string) {
  const handleError = useErrorHandler()

  return useQuery<AfterSalesService[]>({
    queryKey: ['afterSalesService', query, status],
    queryFn: async () => {
      try {
        const queries = [Query.orderDesc('$createdAt')]

        if (query) {
          queries.push(Query.search('clientName', query))
        }

        if (status && status !== 'all') {
          queries.push(Query.equal('status', status))
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.AFTER_SALES_SERVICE,
          queries
        )

        return response.documents as AfterSalesService[]
      } catch (error: any) {
        console.error('Error fetching after sales service data:', error)
        handleError(error, 'Impossible de récupérer les demandes SAV')
        throw error
      }
    },
    retry: (failureCount, error) => {
      return failureCount < 3
    },
  })
}

/**
 * Hook pour créer une nouvelle demande SAV
 * @returns Mutation pour créer une demande SAV
 */
export function useCreateAfterSalesService() {
  const queryClient = useQueryClient()
  const handleError = useErrorHandler()

  return useMutation({
    mutationFn: async (serviceData: AfterSalesServiceInput) => {
      try {
        // Ajouter la date actuelle si non fournie
        const data = {
          ...serviceData,
          date: new Date().toISOString(),
          status: 'nouvelle' as const,
        }

        const response = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.AFTER_SALES_SERVICE,
          'unique()',
          data
        )

        return response
      } catch (error: any) {
        console.error('Error creating after sales service request:', error)
        handleError(error, 'Impossible de créer la demande SAV')
        throw error
      }
    },
    onSuccess: () => {
      // Invalider le cache pour forcer un rechargement des données
      queryClient.invalidateQueries({ queryKey: ['afterSalesService'] })
    },
  })
}

/**
 * Hook pour mettre à jour une demande SAV existante
 * @returns Mutation pour mettre à jour une demande SAV
 */
export function useUpdateAfterSalesService() {
  const queryClient = useQueryClient()
  const handleError = useErrorHandler()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AfterSalesService> }) => {
      try {
        const response = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.AFTER_SALES_SERVICE,
          id,
          data
        )

        return response
      } catch (error: any) {
        console.error('Error updating after sales service request:', error)
        handleError(error, 'Impossible de mettre à jour la demande SAV')
        throw error
      }
    },
    onSuccess: () => {
      // Invalider le cache pour forcer un rechargement des données
      queryClient.invalidateQueries({ queryKey: ['afterSalesService'] })
    },
  })
}

/**
 * Hook pour récupérer les statistiques SAV (nombre de demandes par statut)
 */
export function useAfterSalesServiceStats() {
  const handleError = useErrorHandler()

  return useQuery<{
    total: number;
    inProgress: number;
    highPriority: number;
    completedLast30Days: number;
  }>({
    queryKey: ['afterSalesServiceStats'],
    queryFn: async () => {
      try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

        // Récupérer toutes les demandes pour les analyser
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.AFTER_SALES_SERVICE,
          [Query.limit(100)] // Limiter pour des raisons de performance
        )

        const requests = response.documents as AfterSalesService[]
        
        return {
          total: requests.length,
          inProgress: requests.filter(req => req.status === 'en_cours').length,
          highPriority: requests.filter(req => req.priority === 'high').length,
          completedLast30Days: requests.filter(
            req => req.status === 'terminée' && req.completionDate && req.completionDate >= thirtyDaysAgoISO
          ).length,
        }
      } catch (error: any) {
        console.error('Error fetching after sales service statistics:', error)
        handleError(error, 'Impossible de récupérer les statistiques SAV')
        throw error
      }
    },
    retry: (failureCount, error) => {
      return failureCount < 3
    },
  })
}

