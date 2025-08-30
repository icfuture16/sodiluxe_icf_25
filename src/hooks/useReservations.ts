import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { Reservation, ReservationItem, ReservationInput, ReservationItemInput, ReservationFilters } from '@/types/reservation.types'

/**
 * Hook pour récupérer les réservations avec filtres optionnels
 * @param filters - Filtres optionnels pour les réservations
 * @returns Données des réservations et état de la requête
 */
export function useReservations(filters: ReservationFilters = {}) {
  return useQuery({
    queryKey: ['reservations', filters],
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
          // Cette requête nécessite une recherche plus complexe qui pourrait impliquer
          // de récupérer d'abord les clients correspondants, puis de filtrer les réservations
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
        console.error('Erreur lors du chargement des réservations:', error)
        throw error
      }
    },
  })
}

/**
 * Hook pour récupérer les éléments d'une réservation
 * @param reservationId - ID de la réservation
 * @returns Éléments de la réservation et état de la requête
 */
export function useReservationItems(reservationId: string) {
  return useQuery({
    queryKey: ['reservation-items', reservationId],
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
  })
}

type CreateReservationParams = {
  reservation: ReservationInput
  items: ReservationItemInput[]
}

/**
 * Hook pour créer une nouvelle réservation avec ses articles associés
 * @returns Mutation pour créer une réservation
 */
export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reservation, items }: CreateReservationParams) => {
      try {
        // Créer la réservation
        const createdReservation = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.RESERVATIONS,
          'unique()',
          reservation
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
 * Hook pour mettre à jour le statut d'une réservation existante
 * @returns Mutation pour mettre à jour une réservation
 */
export function useUpdateReservationStatus() {
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
 * Hook pour convertir une réservation en vente
 * @returns Mutation pour convertir une réservation en vente
 */
export function useConvertReservationToSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reservationId }: { reservationId: string }) => {
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
            paymentMethod: 'especes', // Par défaut
            status: 'completed',
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