'use client'

import { useState } from 'react'
import { Sale } from '@/types/appwrite.types'
import { formatDateCompact } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/formatters'
import Link from 'next/link'
import { BsEye } from 'react-icons/bs'

interface SalesTableProps {
  sales: Sale[]
}

export default function SalesTable({ sales }: SalesTableProps) {
  if (!sales?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune vente trouvée
      </div>
    )
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminée'
      case 'pending':
        return 'En attente'
      case 'cancelled':
        return 'Annulée'
      default:
        return status || 'Inconnue'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 ring-green-600/20'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20'
      case 'cancelled':
        return 'bg-red-100 text-red-800 ring-red-600/20'
      default:
        return 'bg-gray-100 text-gray-800 ring-gray-600/20'
    }
  }

  const getPaymentMethodLabel = (method: string, sale: Sale) => {
    // Vérifier s'il y a plusieurs méthodes de paiement via paymentSplits
    if (sale.paymentSplits && sale.paymentSplits.length > 1) {
      return 'mixte'
    }
    
    switch (method) {
      case 'especes':
        return 'espèces'
      case 'carte':
        return 'carte'
      case 'wave':
        return 'wave'
      case 'orange_money':
        return 'orange money'
      case 'cheque':
        return 'chèque'
      case 'cheque_cadeau':
        return 'chèque cadeau'
      case 'virement':
        return 'virement'
      default:
        return method || 'Non spécifié'
    }
  }

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th scope="col" className="py-3.5 pl-8 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-8">
                  Client
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Boutique
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Vendeur
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Montant
                </th>
                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Paiement
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Statut
                </th>
                <th scope="col" className="relative py-3.5 pl-2 pr-8 sm:pr-8">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sales.map((sale: Sale) => (
                <tr key={sale.$id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-8 pr-3 text-sm font-medium text-gray-900 sm:pl-8">
                    {sale.client?.fullName || 'Client inconnu'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {sale.store?.name || 'Boutique inconnue'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {sale.user_seller || 'N/A'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatCurrency(sale.totalAmount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                    {sale.saleDate ? formatDateCompact(sale.saleDate) : formatDateCompact(sale.$createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {getPaymentMethodLabel(sale.paymentMethod, sale)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(sale.status)}`}>
                      {getStatusLabel(sale.status)}
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-2 pr-8 text-right text-sm font-medium sm:pr-8">
                    <Link
                      href={`/ventes/details/${sale.$id}`}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-md transition-colors text-sm font-medium"
                    >
                      <BsEye className="h-4 w-4" />
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}