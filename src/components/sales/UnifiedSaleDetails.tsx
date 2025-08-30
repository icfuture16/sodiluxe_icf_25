'use client'

import { useState } from 'react'
import { Sale } from '@/types/appwrite.types'
import { formatDateCompact } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/formatters'
import { BsArrowUpRight, BsArrowDownRight, BsCreditCard, BsCash, BsPhone, BsBank, BsPlus } from 'react-icons/bs'
import { FaWaze } from 'react-icons/fa'
import AddPaymentModal from './AddPaymentModal'

interface UnifiedSaleDetailsProps {
  sale: Sale
  showCreditDetails?: boolean // Pour afficher/masquer les détails spécifiques aux ventes à crédit
  onSaleUpdate?: (updatedSale: Sale) => void // Callback pour les mises à jour de vente
}

export default function UnifiedSaleDetails({ 
  sale, 
  showCreditDetails = true,
  onSaleUpdate
}: UnifiedSaleDetailsProps) {
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false)
  const [currentSale, setCurrentSale] = useState(sale)

  if (!currentSale) {
    return (
      <div className="text-center py-8 text-gray-500">
        Vente non trouvée
      </div>
    )
  }

  const safePaidAmount = Number(currentSale.paidAmount) || 0
  const safeTotalAmount = Number(currentSale.totalAmount) || 0
  const remainingAmount = safeTotalAmount - safePaidAmount

  const handlePaymentAdded = (updatedSale: Sale) => {
    setCurrentSale(updatedSale)
    if (onSaleUpdate) {
      onSaleUpdate(updatedSale)
    }
  }

  const getStatusLabel = () => {
    if (currentSale.isCredit) {
      if (currentSale.status === 'completed' || safePaidAmount >= safeTotalAmount) {
        return 'Payée'
      } else if (safePaidAmount > 0) {
        return 'Partiellement payée'
      } else {
        return 'En attente'
      }
    } else {
      switch (currentSale.status) {
        case 'completed':
          return 'Terminée'
        case 'pending':
          return 'En attente'
        case 'cancelled':
          return 'Annulée'
        default:
          return currentSale.status
      }
    }
  }

  const getStatusColor = () => {
    if (currentSale.isCredit) {
      if (currentSale.status === 'completed' || safePaidAmount >= safeTotalAmount) {
        return 'bg-green-100 text-green-800 ring-green-600/20'
      } else if (safePaidAmount > 0) {
        return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20'
      } else {
        return 'bg-red-100 text-red-800 ring-red-600/20'
      }
    } else {
      switch (currentSale.status) {
        case 'completed':
          return 'bg-green-50 text-green-700 ring-green-600/20'
        case 'pending':
          return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
        case 'cancelled':
          return 'bg-red-50 text-red-700 ring-red-600/20'
        default:
          return 'bg-gray-50 text-gray-700 ring-gray-600/20'
      }
    }
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'especes':
        return <BsCash className="h-5 w-5" />
      case 'carte':
        return <BsCreditCard className="h-5 w-5" />
      case 'wave':
        return <FaWaze className="h-5 w-5" />
      case 'orange_money':
        return <BsPhone className="h-5 w-5" />
      case 'virement':
        return <BsBank className="h-5 w-5" />
      default:
        return <BsCash className="h-5 w-5" />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'especes':
        return 'Espèces'
      case 'carte':
        return 'Carte'
      case 'wave':
        return 'Wave'
      case 'orange_money':
        return 'Orange Money'
      case 'cheque':
        return 'Chèque'
      case 'cheque_cadeau':
        return 'Chèque cadeau'
      case 'virement':
        return 'Virement'
      default:
        return method || 'Non spécifié'
    }
  }

  return (
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <div className="px-4 py-6 sm:p-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Vente #{currentSale.$id?.slice(-8)}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {currentSale.saleDate ? formatDateCompact(currentSale.saleDate) : formatDateCompact(currentSale.$createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium ring-1 ring-inset ${
              currentSale.isCredit ? 'bg-orange-50 text-orange-700 ring-orange-600/20' : 'bg-blue-50 text-blue-700 ring-blue-600/20'
            }`}>
              {currentSale.isCredit ? 'Vente à crédit' : 'Vente normale'}
            </span>
            <span className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium ring-1 ring-inset ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Client */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Client</h3>
            <p className="text-lg font-semibold text-gray-900">
              {currentSale.client?.fullName || 'Client inconnu'}
            </p>
            {currentSale.client?.phone && (
              <p className="text-sm text-gray-500">{currentSale.client.phone}</p>
            )}
          </div>

          {/* Boutique */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Boutique</h3>
            <p className="text-lg font-semibold text-gray-900">
              {currentSale.store?.name || 'Boutique inconnue'}
            </p>
          </div>

          {/* Vendeur */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Vendeur</h3>
            <p className="text-lg font-semibold text-gray-900">
              {currentSale.user_seller || currentSale.user?.fullName || 'N/A'}
            </p>
          </div>
        </div>

        {/* Montants */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Détails financiers</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <BsArrowUpRight className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Montant total</p>
                  <p className="text-xl font-bold text-blue-900">
                    {formatCurrency(safeTotalAmount)}
                  </p>
                </div>
              </div>
            </div>

            {currentSale.discountAmount && Number(currentSale.discountAmount) > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <BsArrowDownRight className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Remise</p>
                    <p className="text-xl font-bold text-green-900">
                      {formatCurrency(Number(currentSale.discountAmount))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentSale.isCredit && showCreditDetails && (
              <>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <BsArrowUpRight className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Montant payé</p>
                      <p className="text-xl font-bold text-green-900">
                        {formatCurrency(safePaidAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BsArrowDownRight className="h-5 w-5 text-red-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-red-900">Reste à payer</p>
                        <p className="text-xl font-bold text-red-900">
                          {formatCurrency(remainingAmount)}
                        </p>
                      </div>
                    </div>
                    {remainingAmount > 0 && (
                      <button
                        onClick={() => setIsAddPaymentModalOpen(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        <BsPlus className="h-4 w-4 mr-1" />
                        Ajouter un paiement
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Méthode de paiement */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Paiement</h3>
          {currentSale.paymentMethods && currentSale.paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {currentSale.paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {getPaymentIcon(method.method)}
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {getPaymentMethodLabel(method.method)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(Number(method.amount))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucune méthode de paiement enregistrée</p>
          )}
        </div>

        {/* Détails spécifiques aux ventes à crédit */}
        {currentSale.isCredit && showCreditDetails && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations crédit</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {currentSale.initialPayment && Number(currentSale.initialPayment) > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900">Paiement initial</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(Number(currentSale.initialPayment))}
                  </p>
                </div>
              )}

              {currentSale.numberOfInstallments && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900">Nombre d'échéances</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {currentSale.numberOfInstallments}
                  </p>
                </div>
              )}


            </div>
          </div>
        )}

        {/* Produits vendus */}
        {currentSale.items && currentSale.items.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Produits vendus</h3>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix unitaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentSale.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product?.name || 'Produit inconnu'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(Number(item.unitPrice))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal d'ajout de paiement */}
      <AddPaymentModal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        sale={currentSale}
        onPaymentAdded={handlePaymentAdded}
      />
    </div>
  )
}