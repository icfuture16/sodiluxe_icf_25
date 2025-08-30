'use client'

import { useState } from 'react'
import { useNormalSales, useCreditSales } from '@/hooks/useSales'
import { useStores } from '@/hooks/useStores'
import { Sale } from '@/types/appwrite.types'
import UnifiedSaleModal from './UnifiedSaleModal'
import UnifiedSalesTable from './UnifiedSalesTable'

interface SalesManagerProps {
  /** Type de ventes à afficher */
  saleType: 'normal' | 'credit' | 'both'
  /** Titre à afficher */
  title?: string
  /** Description à afficher */
  description?: string
  /** Filtres à appliquer */
  filters?: {
    store_id?: string
    start_date?: string
    end_date?: string
    user_id?: string
  }
  /** Route de base pour les liens de détails */
  baseRoute?: string
  /** Afficher le bouton d'ajout de nouvelle vente */
  showAddButton?: boolean
  /** Texte du bouton d'ajout */
  addButtonText?: string
  /** Classe CSS personnalisée */
  className?: string
}

export default function SalesManager({
  saleType,
  title,
  description,
  filters,
  baseRoute,
  showAddButton = true,
  addButtonText,
  className = ''
}: SalesManagerProps) {
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false)
  const [modalSaleType, setModalSaleType] = useState<'normal' | 'credit'>('normal')
  
  // Hooks pour récupérer les données selon le type
  const { data: normalSales, isLoading: isLoadingNormal, error: errorNormal } = useNormalSales(
    saleType === 'normal' || saleType === 'both' ? filters : undefined
  )
  const { data: creditSales, isLoading: isLoadingCredit, error: errorCredit } = useCreditSales(
    saleType === 'credit' || saleType === 'both' ? filters : undefined
  )
  const { data: stores } = useStores()

  // Combiner les données selon le type demandé
  let allSales: Sale[] = []
  let isLoading = false
  let error = null

  if (saleType === 'normal') {
    allSales = normalSales || []
    isLoading = isLoadingNormal
    error = errorNormal
  } else if (saleType === 'credit') {
    allSales = creditSales || []
    isLoading = isLoadingCredit
    error = errorCredit
  } else if (saleType === 'both') {
    allSales = [...(normalSales || []), ...(creditSales || [])]
    isLoading = isLoadingNormal || isLoadingCredit
    error = errorNormal || errorCredit
  }

  // Trier par date de création (plus récent en premier)
  allSales.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())

  // Déterminer les textes par défaut
  const getDefaultTitle = () => {
    switch (saleType) {
      case 'normal': return 'Ventes normales'
      case 'credit': return 'Ventes à crédit'
      case 'both': return 'Toutes les ventes'
      default: return 'Ventes'
    }
  }

  const getDefaultDescription = () => {
    switch (saleType) {
      case 'normal': return 'Liste de toutes les ventes normales effectuées'
      case 'credit': return 'Liste de toutes les ventes à crédit effectuées'
      case 'both': return 'Liste de toutes les ventes effectuées (normales et à crédit)'
      default: return 'Liste des ventes'
    }
  }

  const getDefaultAddButtonText = () => {
    switch (saleType) {
      case 'normal': return 'Nouvelle vente'
      case 'credit': return 'Nouvelle vente à crédit'
      case 'both': return 'Nouvelle vente'
      default: return 'Nouvelle vente'
    }
  }

  const getDefaultBaseRoute = () => {
    switch (saleType) {
      case 'normal': return '/ventes'
      case 'credit': return '/ventes'
      case 'both': return '/ventes'
      default: return '/ventes'
    }
  }

  const handleAddSale = (type: 'normal' | 'credit') => {
    setModalSaleType(type)
    setIsNewSaleModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="animate-pulse">Chargement des ventes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-4 text-red-500 ${className}`}>
        {error.message || 'Une erreur est survenue lors du chargement des ventes'}
      </div>
    )
  }

  if (!allSales?.length) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        Aucune vente trouvée
      </div>
    )
  }

  return (
    <div className={`mt-8 ${className}`}>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            {title || getDefaultTitle()}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {description || getDefaultDescription()}
          </p>
        </div>
        {showAddButton && (
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            {saleType === 'both' ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAddSale('normal')}
                  className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Nouvelle vente
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSale('credit')}
                  className="block rounded-md bg-orange-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                >
                  Nouvelle vente à crédit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleAddSale(saleType === 'credit' ? 'credit' : 'normal')}
                className={`block rounded-md px-3 py-2 text-center text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  saleType === 'credit'
                    ? 'bg-orange-600 hover:bg-orange-500 focus-visible:outline-orange-600'
                    : 'bg-blue-600 hover:bg-blue-500 focus-visible:outline-blue-600'
                }`}
              >
                {addButtonText || getDefaultAddButtonText()}
              </button>
            )}
          </div>
        )}
      </div>

      <UnifiedSalesTable 
        sales={allSales} 
        showCreditColumns={saleType === 'credit' || saleType === 'both'}
        baseRoute={baseRoute || getDefaultBaseRoute()}
        hideStoreColumn={true}
        hideStatusColumn={true}
      />

      <UnifiedSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={() => setIsNewSaleModalOpen(false)}
        isCredit={modalSaleType === 'credit'}
        storeId={filters?.store_id || ''}
        storeName={stores?.find(store => store.$id === filters?.store_id)?.name || 'Magasin non sélectionné'}
      />
    </div>
  )
}