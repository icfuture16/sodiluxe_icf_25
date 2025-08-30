'use client'

import { useState } from 'react'
import { useNormalSales } from '@/hooks/useSales'
import { useStores } from '@/hooks/useStores'
import { Sale } from '@/types/appwrite.types'
import UnifiedSaleModal from './UnifiedSaleModal'
import UnifiedSalesTable from './UnifiedSalesTable'

interface SalesListProps {
  filters?: {
    store_id?: string
    start_date?: string
    end_date?: string
    user_id?: string
  }
}

export default function SalesList({ filters }: SalesListProps) {
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false)
  const { data: sales, isLoading, error } = useNormalSales(filters)
  const { data: stores } = useStores()

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse">Chargement des ventes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        {error.message || 'Une erreur est survenue lors du chargement des ventes'}
      </div>
    )
  }

  if (!sales?.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        Aucune vente trouvée
      </div>
    )
  }

  return (
    <div className="mt-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Ventes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste de toutes les ventes effectuées
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsNewSaleModalOpen(true)}
            className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Nouvelle vente
          </button>
        </div>
      </div>

      <UnifiedSalesTable 
        sales={sales || []} 
        showCreditColumns={false}
        baseRoute="/ventes"
        hideStoreColumn={true}
        hideStatusColumn={true}
      />

      <UnifiedSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={() => setIsNewSaleModalOpen(false)}
        isCredit={false}
        storeId={filters?.store_id || ''}
        storeName={stores?.find(store => store.$id === filters?.store_id)?.name || 'Magasin non sélectionné'}
      />
    </div>
  )
}
