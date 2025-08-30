'use client'

import { useState, useEffect } from 'react'
import { useCachedReservationItems } from '@/hooks/useCachedReservations'
import { formatCurrency } from '@/lib/utils/formatters'

import { FiPackage } from 'react-icons/fi'

interface ReservationItemsTableProps {
  reservationId: string
  onClose: () => void
}

export default function ReservationItemsTable({ reservationId, onClose }: ReservationItemsTableProps) {
  const { data: items, isLoading, error } = useCachedReservationItems(reservationId)
  const [productNames, setProductNames] = useState<Record<string, string>>({})

  useEffect(() => {
    // Dans un cas réel, nous chargerions les noms des produits à partir de leur ID
    // Pour l'exemple, nous utilisons des noms fictifs
    if (items) {
      const names: Record<string, string> = {}
      items.forEach(item => {
        names[item.productId] = `Produit ${item.productId.substring(0, 4)}`
      })
      setProductNames(names)
    }
  }, [items])

  // Utilisation de la fonction formatCurrency importée

  const calculateTotal = () => {
    if (!items) return 0
    return items.reduce((total, item) => total + item.totalPrice, 0)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FiPackage className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Produits réservés</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Fermer</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-6 text-red-600">
          Une erreur est survenue lors du chargement des produits.
        </div>
      ) : items && items.length > 0 ? (
        <div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix unitaire
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.$id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {productNames[item.productId] || `Produit ${item.productId.substring(0, 4)}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(item.unitPrice)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(item.totalPrice)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="text-base font-medium text-gray-900">
                Total: {formatCurrency(calculateTotal())}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">
          Aucun produit trouvé pour cette réservation.
        </div>
      )}
    </div>
  )
}