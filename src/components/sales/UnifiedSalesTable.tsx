'use client'

import { useState } from 'react'
import { Sale } from '@/types/appwrite.types'
import { formatDateCompact } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/formatters'
import Link from 'next/link'
import { BsEye, BsTrash } from 'react-icons/bs'
import { BsArrowUpRight, BsArrowDownRight } from 'react-icons/bs'
import { useAuth } from '@/hooks/useAuth'
import { useDeleteSale, useDeleteMultipleSales } from '@/hooks/useSales'
import { toast } from 'sonner'

interface UnifiedSalesTableProps {
  sales: Sale[]
  showCreditColumns?: boolean // Pour afficher/masquer les colonnes spécifiques aux ventes à crédit
  baseRoute?: string // Route de base pour les liens de détails
  hideStoreColumn?: boolean // Pour masquer la colonne Boutique
  hideStatusColumn?: boolean // Pour masquer la colonne Statut
}

export default function UnifiedSalesTable({ 
  sales, 
  showCreditColumns = false,
  baseRoute = '/ventes',
  hideStoreColumn = false,
  hideStatusColumn = false
}: UnifiedSalesTableProps) {
  const { userProfile } = useAuth()
  const deleteSale = useDeleteSale()
  const deleteMultipleSales = useDeleteMultipleSales()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedSales, setSelectedSales] = useState<string[]>([])
  const [isSelectAll, setIsSelectAll] = useState(false)
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false)
  
  const isAdmin = userProfile?.role === 'admin'

  const handleDeleteSale = async (saleId: string, clientName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la vente de ${clientName} ? Cette action est irréversible.`)) {
      return
    }

    setDeletingId(saleId)
    try {
      await deleteSale.mutateAsync(saleId)
      toast.success('Vente supprimée avec succès')
    } catch (error) {
      toast.error('Erreur lors de la suppression de la vente')
      console.error('Erreur suppression:', error)
    } finally {
      setDeletingId(null)
    }
  }

  // Gestion de la sélection individuelle
  const handleSelectSale = (saleId: string) => {
    setSelectedSales(prev => {
      const newSelection = prev.includes(saleId)
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
      
      // Mettre à jour l'état de sélection globale
      setIsSelectAll(newSelection.length === sales.length)
      return newSelection
    })
  }

  // Gestion de la sélection globale
  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedSales([])
      setIsSelectAll(false)
    } else {
      setSelectedSales(sales.map(sale => sale.$id))
      setIsSelectAll(true)
    }
  }

  // Suppression multiple
  const handleDeleteMultiple = async () => {
    if (selectedSales.length === 0) return

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${selectedSales.length} vente(s) sélectionnée(s) ? Cette action est irréversible.`
    if (!confirm(confirmMessage)) {
      return
    }

    setIsDeletingMultiple(true)
    try {
      const result = await deleteMultipleSales.mutateAsync(selectedSales)
      
      if (result.errorCount > 0) {
        toast.warning(`${result.successCount} vente(s) supprimée(s), ${result.errorCount} échec(s)`)
      } else {
        toast.success(`${result.successCount} vente(s) supprimée(s) avec succès`)
      }
      
      // Réinitialiser la sélection
      setSelectedSales([])
      setIsSelectAll(false)
    } catch (error) {
      toast.error('Erreur lors de la suppression des ventes')
      console.error('Erreur suppression multiple:', error)
    } finally {
      setIsDeletingMultiple(false)
    }
  }

  if (!sales?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune vente trouvée
      </div>
    )
  }

  const getStatusLabel = (sale: Sale) => {
    if (sale.isCredit) {
      const safePaidAmount = Number(sale.paidAmount) || 0
      const safeTotalAmount = Number(sale.totalAmount) || 0
      
      if (sale.status === 'completed' || safePaidAmount >= safeTotalAmount) {
        return 'Payée'
      } else if (safePaidAmount > 0) {
        return 'Partiellement payée'
      } else {
        return 'En attente'
      }
    } else {
      switch (sale.status) {
        case 'completed':
          return 'Terminée'
        case 'pending':
          return 'En attente'
        case 'cancelled':
          return 'Annulée'
        default:
          return sale.status
      }
    }
  }

  const getStatusColor = (sale: Sale) => {
    if (sale.isCredit) {
      const safePaidAmount = Number(sale.paidAmount) || 0
      const safeTotalAmount = Number(sale.totalAmount) || 0
      
      if (sale.status === 'completed' || safePaidAmount >= safeTotalAmount) {
        return 'bg-green-100 text-green-800 ring-green-600/20'
      } else if (safePaidAmount > 0) {
        return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20'
      } else {
        return 'bg-red-100 text-red-800 ring-red-600/20'
      }
    } else {
      switch (sale.status) {
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

  const getSaleTypeLabel = (sale: Sale) => {
    if (sale.isCredit) {
      const safePaidAmount = Number(sale.paidAmount) || 0
      const safeTotalAmount = Number(sale.totalAmount) || 0
      const remainingAmount = safeTotalAmount - safePaidAmount
      if (remainingAmount <= 0) {
        return 'Payé'
      }
      return 'Crédit'
    }
    return 'Normale'
  }

  const getSaleTypeColor = (sale: Sale) => {
    if (sale.isCredit) {
      const safePaidAmount = Number(sale.paidAmount) || 0
      const safeTotalAmount = Number(sale.totalAmount) || 0
      const remainingAmount = safeTotalAmount - safePaidAmount
      if (remainingAmount <= 0) {
        return 'bg-green-50 text-green-700 ring-green-600/20'
      }
      return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
    }
    return 'bg-blue-50 text-blue-700 ring-blue-600/20'
  }

  return (
    <div className="space-y-4">
      {/* Bouton de suppression multiple */}
      {isAdmin && selectedSales.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
          <span className="text-sm text-blue-700">
            {selectedSales.length} vente(s) sélectionnée(s)
          </span>
          <button
            onClick={handleDeleteMultiple}
            disabled={isDeletingMultiple}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <BsTrash className="w-4 h-4" />
            {isDeletingMultiple ? 'Suppression...' : 'Supprimer la sélection'}
          </button>
        </div>
      )}

      <div className="mt-8 flow-root sales-table-container">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  {/* Colonne de sélection pour les administrateurs */}
                  {isAdmin && (
                    <th scope="col" className="py-3.5 pl-8 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-8">
                      <input
                        type="checkbox"
                        checked={isSelectAll}
                        onChange={handleSelectAll}
                        disabled={isDeletingMultiple}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </th>
                  )}
                  <th scope="col" className="py-3.5 pl-8 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-8">
                    Client
                  </th>
                  {!hideStoreColumn && (
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Boutique
                    </th>
                  )}
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Vendeur
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Montant total
                  </th>
                  {showCreditColumns && (
                    <>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Montant payé
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Reste à payer
                      </th>
                    </>
                  )}
                  <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Paiement
                  </th>
                  {!hideStatusColumn && (
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Statut
                    </th>
                  )}
                  <th scope="col" className="relative py-3.5 pl-1 pr-6 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sales.map((sale: Sale) => {
                const safePaidAmount = Number(sale.paidAmount) || 0
                const safeTotalAmount = Number(sale.totalAmount) || 0
                const remainingAmount = safeTotalAmount - safePaidAmount
                
                return (
                  <tr key={sale.$id} className="hover:bg-gray-50">
                    {/* Colonne de sélection pour les administrateurs */}
                    {isAdmin && (
                      <td className="whitespace-nowrap py-4 pl-8 pr-3 text-sm font-medium text-gray-900 sm:pl-8">
                        <input
                          type="checkbox"
                          checked={selectedSales.includes(sale.$id)}
                          onChange={() => handleSelectSale(sale.$id)}
                          disabled={isDeletingMultiple}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                    )}
                    <td className="whitespace-nowrap py-4 pl-8 pr-3 text-sm font-medium text-gray-900 sm:pl-8">
                      {sale.client?.fullName || 'Client inconnu'}
                    </td>
                    {!hideStoreColumn && (
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {sale.store?.name || 'Boutique inconnue'}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {sale.user_seller || sale.user?.fullName || 'N/A'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getSaleTypeColor(sale)}`}>
                        {getSaleTypeLabel(sale)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                      <div className="flex items-center gap-1">
                        {sale.status === 'completed' ? (
                          <BsArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : sale.status === 'cancelled' ? (
                          <BsArrowDownRight className="h-4 w-4 text-red-500" />
                        ) : null}
                        {formatCurrency(safeTotalAmount)}
                      </div>
                    </td>
                    {showCreditColumns && (
                      <>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-green-600 font-medium">
                          {sale.isCredit ? formatCurrency(safePaidAmount) : '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-red-600 font-medium">
                          {sale.isCredit ? formatCurrency(remainingAmount) : '-'}
                        </td>
                      </>
                    )}
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                      {sale.saleDate ? formatDateCompact(sale.saleDate) : formatDateCompact(sale.$createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </td>
                    {!hideStatusColumn && (
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(sale)}`}>
                          {getStatusLabel(sale)}
                        </span>
                      </td>
                    )}
                    <td className="relative whitespace-nowrap py-4 pl-1 pr-6 text-right text-sm font-medium sm:pr-6">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`${baseRoute}/details/${sale.$id}`}
                          className="inline-flex items-center px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                        >
                          <BsEye className="mr-1" />
                          Voir
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteSale(sale.$id, sale.client?.fullName || 'Client inconnu')}
                            disabled={deletingId === sale.$id}
                            className="inline-flex items-center px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Supprimer la vente"
                          >
                            <BsTrash className="mr-1" />
                            {deletingId === sale.$id ? 'Suppression...' : 'Supprimer'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  )
}