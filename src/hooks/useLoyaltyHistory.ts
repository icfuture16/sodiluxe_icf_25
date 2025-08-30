import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { LoyaltyHistory, LoyaltyHistoryInput } from '@/types/client.types'
import { useErrorHandler } from './useErrorHandler'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'

/**
 * Hook pour récupérer l'historique de fidélité d'un client
 * @param clientId - ID du client
 * @returns Historique de fidélité du client
 */
export function useLoyaltyHistory(clientId: string) {
  const handleError = useErrorHandler()

  return useQuery({
    queryKey: ['loyaltyHistory', clientId],
    queryFn: async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.LOYALTY_HISTORY,
          [
            Query.equal('clientId', clientId),
            Query.orderDesc('$createdAt')
          ]
        )

        return response.documents as LoyaltyHistory[]
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique de fidélité:', error)
        handleError(error, 'Impossible de récupérer l\'historique de fidélité')
        throw error
      }
    },
    enabled: !!clientId,
  })
}

/**
 * Hook pour créer un nouvel enregistrement d'historique de fidélité
 * @returns Mutation pour créer un historique de fidélité
 */
export function useCreateLoyaltyHistory() {
  const queryClient = useQueryClient()
  const handleError = useErrorHandler()

  return useMutation({
    mutationFn: async (loyaltyHistory: LoyaltyHistoryInput) => {
      try {
        const historyWithDate = {
          ...loyaltyHistory,
          date: new Date().toISOString()
        }

        const data = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.LOYALTY_HISTORY,
          'unique()',
          historyWithDate
        )

        return data as LoyaltyHistory
      } catch (error) {
        console.error('Erreur lors de la création de l\'historique de fidélité:', error)
        handleError(error, 'Impossible de créer l\'historique de fidélité')
        throw error
      }
    },
    onSuccess: (data) => {
      // Invalider les requêtes d'historique pour ce client
      queryClient.invalidateQueries({ queryKey: ['loyaltyHistory', data.clientId] })
      // Invalider aussi les données des clients pour mettre à jour les points
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

/**
 * Hook pour calculer et attribuer des points de fidélité lors d'une vente
 * @returns Fonction pour calculer les points
 */
export function useCalculateLoyaltyPoints() {
  const createLoyaltyHistory = useCreateLoyaltyHistory()
  const { mutateAsync: updateClient } = useUpdateCachedClient()
  const { settings } = useSystemSettings()

  return useMutation({
    mutationFn: async ({
      clientId,
      saleAmount,
      saleId,
      storeId,
      loyaltyPointsRate = 0.5 // Taux par défaut, peut être récupéré des paramètres système
    }: {
      clientId: string
      saleAmount: number
      saleId: string
      storeId?: string
      loyaltyPointsRate?: number
    }) => {
      try {
        // Calculer les points à attribuer (taux en pourcentage)
        const pointsToAdd = Math.floor(saleAmount * (loyaltyPointsRate / 100))

        if (pointsToAdd <= 0) {
          console.log('Aucun point de fidélité à attribuer pour cette vente')
          return { pointsAdded: 0 }
        }

        // Récupérer les données actuelles du client
        const clientResponse = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.CLIENTS,
          clientId
        )

        const currentPoints = clientResponse.loyaltyPoints || 0
        const currentTotalSpent = clientResponse.totalSpent || 0
        const newTotalPoints = currentPoints + pointsToAdd
        const newTotalSpent = currentTotalSpent + saleAmount

        // Déterminer le nouveau statut de fidélité basé sur les points configurables
        let newLoyaltyStatus: 'bronze' | 'argent' | 'or' = 'bronze'
        if (newTotalPoints >= settings.loyaltyLevels.gold.threshold) {
          newLoyaltyStatus = 'or'
        } else if (newTotalPoints >= settings.loyaltyLevels.silver.threshold) {
          newLoyaltyStatus = 'argent'
        }

        // Mettre à jour les points et le total dépensé du client
        await updateClient({
          id: clientId,
          updates: {
            loyaltyPoints: newTotalPoints,
            loyaltyStatus: newLoyaltyStatus,
            totalSpent: newTotalSpent
          }
        })

        // Créer un enregistrement dans l'historique de fidélité
        await createLoyaltyHistory.mutateAsync({
          clientId,
          pointsAdded: pointsToAdd,
          source: 'purchase',
          saleId,
          description: `Points gagnés pour un achat de ${saleAmount} FCFA`,
          storeId
        })

        console.log(`Points de fidélité attribués: ${pointsToAdd} points pour le client ${clientId}`)
        return { pointsAdded: pointsToAdd, newTotalPoints, newLoyaltyStatus }
      } catch (error) {
        console.error('Erreur lors du calcul des points de fidélité:', error)
        throw error
      }
    }
  })
}

// Import nécessaire pour useUpdateCachedClient
import { useUpdateCachedClient } from './useCachedClients'