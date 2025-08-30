'use client'

import { BsBarChart } from 'react-icons/bs'
import { formatCurrency } from '@/lib/utils/formatters'

interface TopProduct {
  productId: string
  name: string
  sales: number
  revenue: number
  margin: number
}

interface TopProductsChartProps {
  data: TopProduct[]
  className?: string
}

export default function TopProductsChart({ data, className = '' }: TopProductsChartProps) {
  // Utilisation de la fonction formatCurrency importée

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BsBarChart className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Top Produits</h3>
      </div>
      
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Produit
              </th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                Ventes
              </th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                CA
              </th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                Marge
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.length > 0 ? (
              data.map((product) => (
                <tr key={product.productId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    {product.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                    {product.sales}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 text-right">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                    <span 
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        product.margin >= 30 
                          ? 'bg-green-50 text-green-700 ring-green-600/20' 
                          : product.margin >= 20 
                            ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                            : product.margin >= 10
                              ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                              : 'bg-red-50 text-red-700 ring-red-600/20'
                      } ring-1 ring-inset`}
                    >
                      {formatPercentage(product.margin)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-10 text-center text-gray-400">
                  <p>Chargement des données produits...</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}