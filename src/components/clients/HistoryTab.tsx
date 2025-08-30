import React, { useState } from 'react'
import { useSales } from '@/hooks/useSales'
import { Client } from '@/types/appwrite.types'
import { formatDate } from '@/lib/utils/formatters'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface HistoryTabProps {
  client: Client
}

const ITEMS_PER_PAGE = 5

export default function HistoryTab({ client }: HistoryTabProps) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const { data: sales, isLoading, error } = useSales()

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-4">Historique des achats</h4>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-4">Historique des achats</h4>
        <p className="text-red-500 text-sm">Erreur lors du chargement de l'historique</p>
      </div>
    )
  }

  const clientSales = sales?.filter(sale => sale.clientId === client.$id) || []
  const totalPages = Math.ceil(clientSales.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentSales = clientSales.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-4">Historique des achats</h4>
      
      {clientSales.length === 0 ? (
        <p className="text-gray-500 text-sm italic">Aucun achat trouvé pour ce client</p>
      ) : (
        <>
          <div className="space-y-3">
            {currentSales.map((sale) => (
              <div key={sale.$id} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">Vente #{sale.$id.slice(-6)}</p>
                    <p className="text-sm text-gray-500">{formatDate(sale.$createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{Math.round(sale.totalAmount)} FCFA</p>
                    <p className="text-sm text-gray-500">{sale.paymentSplits && sale.paymentSplits.length > 1 ? 'Mixte' : sale.paymentMethod}</p>
                  </div>
                </div>
                
                {sale.items && sale.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Articles:</p>
                    <div className="space-y-1">
                      {sale.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm text-gray-600">
                          <span>{item.product?.name || 'Produit inconnu'} x{item.quantity}</span>
                          <span>{Math.round(item.unitPrice * item.quantity)} FCFA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {sale.store && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400">Magasin: {sale.store.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages} ({clientSales.length} achat{clientSales.length > 1 ? 's' : ''})
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}