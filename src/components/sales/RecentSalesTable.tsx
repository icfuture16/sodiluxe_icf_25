'use client'

import { BsArrowUpRight, BsArrowDownRight } from 'react-icons/bs'
import { formatCurrency } from '@/lib/utils/formatters'

interface Sale {
  id: string
  date: Date
  customer: {
    name: string
    email: string
    address?: string
    gender?: 'homme' | 'femme' | 'entreprise'
    birthDate?: string
  }
  store: string
  seller?: {
    name: string
  }
  amount: number
  status: 'completed' | 'pending' | 'cancelled'
  products: {
    name: string
    quantity: number
  }[]
}

interface RecentSalesTableProps {
  sales: Sale[]
}

export default function RecentSalesTable({ sales }: RecentSalesTableProps) {
  // Utilisation de la fonction formatCurrency importée

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusColor = (status: Sale['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 ring-green-600/20'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
      case 'cancelled':
        return 'bg-red-50 text-red-700 ring-red-600/20'
    }
  }

  const getStatusLabel = (status: Sale['status']) => {
    switch (status) {
      case 'completed':
        return 'Terminée'
      case 'pending':
        return 'En attente'
      case 'cancelled':
        return 'Annulée'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Dernières ventes</h3>
      </div>
      <div className="flow-root">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">
                  Boutique
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Produits
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Montant
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="py-4 pl-6 pr-3 whitespace-nowrap text-sm text-gray-500">
                      {sale.store}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <ul>
                        {sale.products.map((product, index) => (
                          <li key={index}>
                            {product.name} (x{product.quantity})
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDate(sale.date)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <div className="flex items-center gap-1">
                        {sale.status === 'completed' ? (
                          <BsArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : sale.status === 'cancelled' ? (
                          <BsArrowDownRight className="h-4 w-4 text-red-500" />
                        ) : null}
                        <span className="font-medium text-gray-900">
                          {formatCurrency(sale.amount)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(sale.status)}`}>
                        {getStatusLabel(sale.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    <p>Chargement des données de ventes...</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
