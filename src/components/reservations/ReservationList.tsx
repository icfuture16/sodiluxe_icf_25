'use client'

import { useState, useCallback } from 'react'
import { useReservationsWithDetails } from '@/hooks/useReservationsWithDetails'
import { useUpdateCachedReservationStatus, useDeleteCachedReservation, useConvertCachedReservationToSale, useCachedReservationItems } from '@/hooks/useCachedReservations'
import { useProducts } from '@/hooks/useProducts'
import { ReservationFilters, ReservationItem } from '@/types/reservation.types'
import { Client, Product } from '@/types/appwrite.types'
import ReservationFiltersComponent from './ReservationFilters'
import ReservationTable from './ReservationTable'
import NewReservationModal from './NewReservationModal'
import ConvertReservationToSaleModal from './ConvertReservationToSaleModal'
import { FiPlus } from 'react-icons/fi'
import { Store } from '@/types/appwrite.types'
import { toast } from 'sonner'

interface ReservationListProps {
  stores: Store[]; // Add stores prop
}

export default function ReservationList({ stores }: ReservationListProps) {
  const [filters, setFilters] = useState<ReservationFilters>({})
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false)
  const [convertingReservation, setConvertingReservation] = useState<string | null>(null)
  const [deletingReservation, setDeletingReservation] = useState<string | null>(null)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [reservationToConvert, setReservationToConvert] = useState<string | null>(null)
  const [convertReservationItems, setConvertReservationItems] = useState<ReservationItem[]>([])
  const [convertClient, setConvertClient] = useState<Client | null>(null)
  const [convertStore, setConvertStore] = useState<Store | null>(null)
  const [convertProducts, setConvertProducts] = useState<Product[]>([])  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const { data: reservations, isLoading, error } = useReservationsWithDetails(filters)
  const { data: products } = useProducts()
  const updateReservationStatus = useUpdateCachedReservationStatus()
  const deleteReservation = useDeleteCachedReservation()
  const convertReservationToSale = useConvertCachedReservationToSale()

  const handleFilterChange = useCallback((newFilters: ReservationFilters) => {
    setFilters(newFilters)
  }, [])

  const handleDelete = useCallback((reservationId: string) => {
    setShowDeleteConfirm(reservationId)
  }, [])

  const confirmDelete = useCallback(async (reservationId: string) => {
    setShowDeleteConfirm(null)
    setDeletingReservation(reservationId)
    try {
      await deleteReservation.mutateAsync({ reservationId })
      toast.success('Réservation supprimée définitivement avec succès')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression de la réservation')
    } finally {
      setDeletingReservation(null)
    }
  }, [deleteReservation])

  const handleConvert = useCallback(async (reservationId: string) => {
     try {
       // Récupérer la réservation enrichie avec les données client et magasin
       const reservation = reservations?.find(r => r.$id === reservationId)
       
       if (!reservation) {
         toast.error('Réservation introuvable')
         return
       }
       
       // Les données client et magasin sont déjà enrichies par useReservationsWithDetails
       const client = reservation.client
       const store = reservation.store
       
       if (!client || !store) {
         toast.error('Impossible de récupérer les informations du client ou du magasin')
         return
       }
       
       // Récupérer les articles de la réservation directement via l'API
       const { databases, DATABASE_ID, COLLECTIONS, Query } = await import('@/lib/appwrite/client')
       const itemsResponse = await databases.listDocuments(
         DATABASE_ID,
         COLLECTIONS.RESERVATION_ITEMS,
         [Query.equal('reservationId', reservationId)]
       )
       const items = itemsResponse.documents as ReservationItem[]
       
       // Récupérer les produits des articles
       const productIds = items.map(item => item.productId)
       const reservationProducts = products?.filter(p => productIds.includes(p.$id)) || []
       
       setReservationToConvert(reservationId)
       setConvertReservationItems(items)
       setConvertClient(client)
       setConvertStore(store)
       setConvertProducts(reservationProducts)
       setShowConvertModal(true)
     } catch (error) {
       console.error('Error preparing conversion:', error)
       toast.error('Erreur lors de la préparation de la conversion')
     }
   }, [reservations, products])

  const handleConvertSuccess = useCallback(() => {
    setShowConvertModal(false)
    setReservationToConvert(null)
    setConvertReservationItems([])
    setConvertClient(null)
    setConvertStore(null)
    setConvertProducts([])
  }, [])

  const handleCloseConvertModal = useCallback(() => {
    if (!convertingReservation) {
      setShowConvertModal(false)
      setReservationToConvert(null)
    }
  }, [convertingReservation])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-semibold text-gray-900">Réservations</h1>
            </div>
            <button
              onClick={() => setIsNewReservationModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              <FiPlus className="h-5 w-5" />
              Créer une réservation
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <ReservationFiltersComponent filters={filters} onFilterChange={setFilters} stores={stores} />
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md m-6">
                Une erreur est survenue lors du chargement des réservations.
              </div>
            ) : reservations?.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Aucune réservation trouvée.</p>
                <button
                  onClick={() => setIsNewReservationModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
                >
                  <FiPlus className="h-5 w-5" />
                  Créer une réservation
                </button>
              </div>
            ) : (
              <ReservationTable 
                reservations={reservations || []} 
                onConvert={handleConvert}
                onDelete={handleDelete}
                loadingStates={{
                  converting: convertingReservation,
                  deleting: deletingReservation
                }}
              />
            )}
          </div>
        </div>
      </main>

      <NewReservationModal
        open={isNewReservationModalOpen}
        onClose={() => setIsNewReservationModalOpen(false)}
      />

      {reservationToConvert && convertClient && convertStore && (() => {
        const reservation = reservations?.find(r => r.$id === reservationToConvert)
        return reservation ? (
          <ConvertReservationToSaleModal
            isOpen={showConvertModal}
            onClose={() => {
              setShowConvertModal(false)
              setReservationToConvert(null)
              setConvertReservationItems([])
              setConvertClient(null)
              setConvertStore(null)
              setConvertProducts([])
            }}
            reservation={reservation}
            reservationItems={convertReservationItems}
            client={convertClient}
            store={convertStore}
            products={convertProducts}
            onSuccess={handleConvertSuccess}
          />
        ) : null
      })()}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement cette réservation ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Annuler
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}