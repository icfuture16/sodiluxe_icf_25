'use client'

import { useMemo } from 'react'
import { BsArrowUpRight, BsArrowDownRight } from 'react-icons/bs'
import { formatCurrency } from '@/lib/utils/formatters'
import RecentSalesTable from '../sales/RecentSalesTable'
import { useCachedSales } from '@/hooks/useCachedSales'

export default function RecentSalesSection() {
  // Using useCachedSales without filters as the interface doesn't support limit and orderDesc
  const { data: salesData, isLoading } = useCachedSales({})

  const formattedSales = useMemo(() => {
    if (!salesData || !Array.isArray(salesData)) return []

    return salesData.map(sale => ({
      id: sale.$id,
      date: new Date(sale.$createdAt),
      customer: {
        name: sale.client?.fullName || 'Client inconnu',
        email: sale.client?.email || ''
      },
      store: sale.store?.name || 'Boutique inconnue',
      amount: sale.totalAmount || 0,
      status: sale.status || 'completed',
      products: sale.items?.map(item => ({
        name: item.product?.name || 'Produit inconnu',
        quantity: item.quantity || 1
      })) || []
    }))
  }, [salesData])

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Dernières ventes</h3>
          </div>
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <RecentSalesTable sales={formattedSales} />
    </div>
  )
}