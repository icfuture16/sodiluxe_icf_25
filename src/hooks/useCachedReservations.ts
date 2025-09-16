import { useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { Reservation, ReservationItem, ReservationInput, ReservationItemInput, ReservationFilters } from '@/types/reservation.types'
import { useCachedQuery } from './useCachedQuery'

/**
 * Hook pour récupérer les réservations avec filtres optionnels et gestion du cache
 * @param filters - Filtres optionnels pour les réservations
 * @returns Données des réservations et état de la requête
 */
export function useCachedReservations(filters: ReservationFilters = {}) {
  const filterKey = JSON.stringify(filters)
  
  return useCachedQuery<Reservation[]>({
    namespace: 'reservations',
    key: filterKey,
    queryFn: async () => {
      try {
        const queries = [Query.orderDesc('$createdAt')]

        if (filters.storeId) {
          queries.push(Query.equal('storeId', filters.storeId))
        }

        if (filters.status && filters.status.length > 0) {
          queries.push(Query.equal('status', filters.status))
        }

        if (filters.dateRange?.start) {
          queries.push(Query.greaterThanEqual('expectedPickupDate', filters.dateRange.start))
        }

        if (filters.dateRange?.end) {
          queries.push(Query.lessThanEqual('expectedPickupDate', filters.dateRange.end))
        }

        if (filters.clientSearch) {
          // Utilisation de equal au lieu de search pour éviter l'erreur d'index fulltext
          queries.push(Query.equal('clientId', filters.clientSearch))
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.RESERVATIONS,
          queries
        )

        return response.documents as Reservation[]
      } catch (error: any) {
        if (error.code === 404) {
          console.error('Collection réservations non trouvée:', error)
          throw new Error('La collection réservations n\'existe pas')
        } else if (error.code === 401) {
          console.error('Erreur d\'authentification:', error)
          throw new Error('Vous n\'êtes pas autorisé à accéder aux réservations')
        } else {
          console.error('Erreur lors du chargement des réservations:', error)
          throw error
        }
      }
    },
    successMessage: 'Réservations chargées avec succès',
    errorMessage: 'Erreur lors du chargement des réservations',
    retryCount: 2,
    priority: 'medium',
  })
}

/**
 * Hook pour récupérer les éléments d'une réservation avec gestion du cache
 * @param reservationId - ID de la réservation
 * @returns Éléments de la réservation et état de la requête
 */
export function useCachedReservationItems(reservationId: string) {
  return useCachedQuery<ReservationItem[]>({
    namespace: 'reservation-items',
    key: reservationId,
    queryFn: async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.RESERVATION_ITEMS,
          [Query.equal('reservationId', reservationId)]
        )

        return response.documents as ReservationItem[]
      } catch (error: any) {
        console.error('Erreur lors du chargement des éléments de réservation:', error)
        throw error
      }
    },
    enabled: !!reservationId,
    successMessage: 'Éléments de réservation chargés avec succès',
    errorMessage: 'Erreur lors du chargement des éléments de réservation',
    retryCount: 1,
    priority: 'medium',
  })
}

type CreateReservationParams = {
  reservation: ReservationInput
  items: ReservationItemInput[]
}

/**
 * Hook pour créer une nouvelle réservation avec ses articles associés et gestion du cache
 * @returns Mutation pour créer une réservation
 */
export function useCreateCachedReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reservation, items }: CreateReservationParams) => {
      try {
        // Calculer le montant total basé sur les items
        const totalAmount = items.reduce(
          (sum, item) => sum + (item.unitPrice * item.quantity),
          0
        )

        // Créer la réservation avec le totalAmount calculé
        const createdReservation = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.RESERVATIONS,
          'unique()',
          {
            ...reservation,
            totalAmount
          }
        ) as Reservation

        // Créer les articles de réservation
        const reservationItems = await Promise.all(
          items.map(item =>
            databases.createDocument(
              DATABASE_ID,
              COLLECTIONS.RESERVATION_ITEMS,
              'unique()',
              {
                ...item,
                reservationId: createdReservation.$id,
              }
            )
          )
        )

        return {
          reservation: createdReservation,
          items: reservationItems as ReservationItem[],
        }
      } catch (error: any) {
        console.error('Erreur lors de la création de la réservation:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}

/**
 * Hook pour mettre à jour le statut d'une réservation existante avec gestion du cache
 * @returns Mutation pour mettre à jour une réservation
 */
export function useUpdateCachedReservationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: 'active' | 'confirmed' | 'completed' | 'cancelled' | 'expired'
    }) => {
      try {
        const data = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.RESERVATIONS,
          id,
          { status }
        )

        return data as Reservation
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour de la réservation:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}

/**
 * Hook pour supprimer définitivement une réservation et tous ses articles associés
 * @returns Mutation pour supprimer une réservation
 */
export function useDeleteCachedReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reservationId }: { reservationId: string }) => {
      try {
        // 1. Récupérer tous les articles de la réservation
        const itemsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.RESERVATION_ITEMS,
          [Query.equal('reservationId', reservationId)]
        )

        const reservationItems = itemsResponse.documents as ReservationItem[]

        // 2. Supprimer tous les articles de la réservation
        for (const item of reservationItems) {
          await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.RESERVATION_ITEMS,
            item.$id
          )
        }

        // 3. Supprimer la réservation elle-même
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.RESERVATIONS,
          reservationId
        )

        return { reservationId, deletedItemsCount: reservationItems.length }
      } catch (error: any) {
        console.error('Erreur lors de la suppression de la réservation:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['reservation-items'] })
    },
  })
}

/**
 * Hook pour convertir une réservation en vente avec gestion du cache
 * @returns Mutation pour convertir une réservation en vente
 */
export function useConvertCachedReservationToSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      reservationId, 
      saleType 
    }: { 
      reservationId: string
      saleType: 'direct' | 'deferred'
    }) => {
      try {
        // 1. Récupérer la réservation et ses articles
        const reservation = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.RESERVATIONS,
          reservationId
        ) as Reservation

        const itemsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.RESERVATION_ITEMS,
          [Query.equal('reservationId', reservationId)]
        )

        const reservationItems = itemsResponse.documents as ReservationItem[]

        // 2. Créer une nouvelle vente
        const sale = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.SALES,
          'unique()',
          {
            clientId: reservation.clientId,
            storeId: reservation.storeId,
            userId: reservation.createdBy,
            totalAmount: reservationItems.reduce(
              (sum, item) => sum + (item.unitPrice * item.quantity),
              0
            ),
            discountAmount: 0,
            paymentMethod: saleType === 'deferred' ? 'credit' : 'especes',
            status: saleType === 'deferred' ? 'pending' : 'completed',
            reservationId: reservationId,
          }
        )

        // 3. Créer les articles de vente
        for (const item of reservationItems) {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.SALE_ITEMS,
            'unique()',
            {
              productId: item.productId,
              saleId: sale.$id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountAmount: 0,
            }
          )
        }

        // 4. Mettre à jour le statut de la réservation
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.RESERVATIONS,
          reservationId,
          { status: 'completed' }
        )

        return { sale, reservation }
      } catch (error: any) {
        console.error('Erreur lors de la conversion de la réservation en vente:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

