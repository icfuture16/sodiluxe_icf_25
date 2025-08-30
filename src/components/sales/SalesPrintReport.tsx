'use client'

import { Sale } from '@/types/appwrite.types'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface SalesFilters {
  storeId?: string | null
  startDate?: Date | null
  endDate?: Date | null
  status?: 'pending' | 'completed' | 'cancelled' | null
  paymentMethod?: string | null
  minAmount?: string
  maxAmount?: string
  searchTerm?: string
}

interface SalesPrintReportProps {
  sales: Sale[]
  filters: SalesFilters
  storeName?: string
}

export default function SalesPrintReport({ sales, filters, storeName = 'Sodiluxe' }: SalesPrintReportProps) {
  const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const completedSales = sales.filter(sale => sale.status === 'completed')
  const pendingSales = sales.filter(sale => sale.status === 'pending')
  const cancelledSales = sales.filter(sale => sale.status === 'cancelled')

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminée'
      case 'pending': return 'En attente'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Espèces'
      case 'card': return 'Carte'
      case 'transfer': return 'Virement'
      case 'check': return 'Chèque'
      default: return method
    }
  }

  return (
    <div className="print-report hidden print:block bg-white text-black">
      <style jsx global>{`
        @media print {
          * {
            margin: 0 !important;
            padding: 0 !important;
          }
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 12px;
            line-height: 1.4;
          }
          .print-report {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            padding: 20px !important;
            box-sizing: border-box !important;
            z-index: 9999 !important;
            background: white !important;
            overflow: auto !important;
          }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          table { 
            border-collapse: collapse; 
            width: 100% !important;
            margin: 0 !important;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 6px !important; 
            text-align: left; 
            font-size: 11px !important;
          }
          th { 
            background-color: #f5f5f5 !important; 
            font-weight: bold; 
          }
          .container, .mx-auto, .px-4 {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* En-tête */}
      <div className="mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{storeName}</h1>
            <p className="text-gray-600 text-sm">Rapport des ventes</p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>Généré le {format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
            <p>{sales.length} vente{sales.length > 1 ? 's' : ''} trouvée{sales.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Filtres appliqués */}
        {(filters.startDate || filters.endDate || filters.status || filters.paymentMethod || filters.searchTerm) && (
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Filtres appliqués :</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {filters.startDate && (
                <p><strong>Date de début :</strong> {format(filters.startDate, 'dd/MM/yyyy', { locale: fr })}</p>
              )}
              {filters.endDate && (
                <p><strong>Date de fin :</strong> {format(filters.endDate, 'dd/MM/yyyy', { locale: fr })}</p>
              )}
              {filters.status && (
                <p><strong>Statut :</strong> {getStatusLabel(filters.status)}</p>
              )}
              {filters.paymentMethod && (
                <p><strong>Méthode de paiement :</strong> {getPaymentMethodLabel(filters.paymentMethod)}</p>
              )}
              {filters.searchTerm && (
                <p><strong>Recherche :</strong> {filters.searchTerm}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="mb-4">
        <h2 className="text-base font-semibold mb-2">Résumé</h2>
        <div className="grid grid-cols-5 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{sales.length}</div>
            <div className="text-xs text-gray-600">Total ventes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{completedSales.length}</div>
            <div className="text-xs text-gray-600">Terminées</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">{pendingSales.length}</div>
            <div className="text-xs text-gray-600">En attente</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{cancelledSales.length}</div>
            <div className="text-xs text-gray-600">Annulées</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-700">{formatCurrency(totalAmount)}</div>
            <div className="text-xs text-gray-600">Chiffre d'affaires total</div>
          </div>
        </div>
      </div>

      {/* Tableau des ventes */}
      <div>
        <h2 className="text-base font-semibold mb-2">Détail des ventes</h2>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left font-medium text-gray-700 border-b">
                  Date
                </th>
                <th className="px-2 py-1 text-left font-medium text-gray-700 border-b">
                  N° Vente
                </th>
                <th className="px-2 py-1 text-left font-medium text-gray-700 border-b">
                  Client
                </th>
                <th className="px-2 py-1 text-left font-medium text-gray-700 border-b">
                  Articles
                </th>
                <th className="px-2 py-1 text-left font-medium text-gray-700 border-b">
                  Statut
                </th>
                <th className="px-2 py-1 text-left font-medium text-gray-700 border-b">
                  Paiement
                </th>
                <th className="px-2 py-1 text-right font-medium text-gray-700 border-b">
                  Total
                </th>
              </tr>
            </thead>
          <tbody>
            {sales.map((sale, index) => (
              <tr key={sale.$id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-2 py-1 text-xs text-gray-900 border-b">{format(new Date(sale.$createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</td>
                <td className="px-2 py-1 text-xs text-gray-900 border-b font-mono">{sale.$id}</td>
                <td className="px-2 py-1 text-xs text-gray-900 border-b">
                  {sale.client && (
                    <div>
                      <p className="font-medium">{sale.client.fullName}</p>
                      {sale.client?.phone && (
                        <p className="text-xs text-gray-600">{sale.client.phone}</p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1 text-xs text-gray-900 border-b">
                  <div className="text-xs">
                    {sale.items && sale.items.slice(0, 3).map((item, idx) => (
                      <p key={idx}>{item.quantity}x {item.product?.name || 'Produit'}</p>
                    ))}
                    {sale.items && sale.items.length > 3 && (
                      <p className="text-gray-500">+{sale.items.length - 3} autre{sale.items.length - 3 > 1 ? 's' : ''}</p>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1 text-xs border-b">
                  <span className={`px-1 py-0.5 text-xs rounded ${
                    sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                    sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getStatusLabel(sale.status)}
                  </span>
                </td>
                <td className="px-2 py-1 text-xs text-gray-900 border-b">
                  <div className="text-xs">
                    <p>{getPaymentMethodLabel(sale.paymentMethod)}</p>
                  </div>
                </td>
                <td className="px-2 py-1 text-xs text-gray-900 border-b text-right font-semibold">{formatCurrency(sale.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      {/* Pied de page */}
      <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
        <p>Rapport généré automatiquement par {storeName} - {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
      </div>
    </div>
  )
}