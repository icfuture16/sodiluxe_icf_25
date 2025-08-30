import { useQuery } from '@tanstack/react-query'
import { useCachedReservations } from './useCachedReservations'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { Reservation, ReservationItem, ReservationFilters } from '@/types/reservation.types'
import { Client } from '@/types/client.types'
import { Store } from '@/types/appwrite.types'
import { Product } from '@/types/product.types'

/**
 * Type pour un item de réservation enrichi avec les informations du produit
 */
export interface ReservationItemWithProduct extends ReservationItem {
  product?: Product | null
}

/**
 * Type pour une réservation enrichie avec les informations client, magasin et produits
 */
export interface ReservationWithDetails extends Reservation {
  client?: Client | null
  store?: Store | null
  items?: ReservationItemWithProduct[]
}

/**
 * Hook pour récupérer les réservations avec les détails du client, magasin et produits
 * @param filters - Filtres optionnels pour les réservations
 * @returns Données des réservations enrichies et état de la requête
 */
export function useReservationsWithDetails(filters: ReservationFilters = {}) {
  const { data: reservations, isLoading: isLoadingReservations, error: reservationsError } = useCachedReservations(filters)

  return useQuery<ReservationWithDetails[]>({
    queryKey: ['reservations-with-details', filters],
    queryFn: async () => {
      if (!reservations || reservations.length === 0) {
        return []
      }

      const enrichedReservations = await Promise.all(
        reservations.map(async (reservation) => {
          let client: Client | null = null
          let store: Store | null = null
          let items: ReservationItemWithProduct[] = []

          // Récupération des informations client
          if (reservation.clientId) {
            try {
              const clientResponse = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.CLIENTS,
                reservation.clientId
              )
              client = clientResponse as Client
            } catch (error) {
              console.warn(`Client non trouvé pour l'ID: ${reservation.clientId}`, error)
            }
          }

          // Récupération des informations magasin
          if (reservation.storeId) {
            try {
              const storeResponse = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.STORES,
                reservation.storeId
              )
              store = storeResponse as Store
            } catch (error) {
              console.warn(`Magasin non trouvé pour l'ID: ${reservation.storeId}`, error)
            }
          }

          // Récupération des items de réservation et leurs produits
          try {
            const itemsResponse = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.RESERVATION_ITEMS,
              [Query.equal('reservationId', reservation.$id)]
            )

            const reservationItems = itemsResponse.documents as ReservationItem[]

            // Enrichir chaque item avec ses informations produit
            items = await Promise.all(
              reservationItems.map(async (item) => {
                let product: Product | null = null

                if (item.productId) {
                  try {
                    const productResponse = await databases.getDocument(
                      DATABASE_ID,
                      COLLECTIONS.PRODUCTS,
                      item.productId
                    )
                    product = productResponse as Product
                  } catch (error) {
                    console.warn(`Produit non trouvé pour l'ID: ${item.productId}`, error)
                  }
                }

                return {
                  ...item,
                  product,
                }
              })
            )
          } catch (error) {
            console.warn(`Items de réservation non trouvés pour la réservation: ${reservation.$id}`, error)
          }

          return {
            ...reservation,
            client,
            store,
            items,
          }
        })
      )

      return enrichedReservations
    },
    enabled: !!reservations && !isLoadingReservations && !reservationsError,
  })
}