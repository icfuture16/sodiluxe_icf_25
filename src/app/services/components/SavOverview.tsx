'use client'

import { BsHeadset, BsClipboardCheck, BsClock, BsExclamationTriangle, BsX } from 'react-icons/bs'
import { ServiceAfterSale } from './types'

interface SavOverviewProps {
  afterSales: ServiceAfterSale[]
  waitingSav: ServiceAfterSale[]
  pendingSav: ServiceAfterSale[]
  completedSav: ServiceAfterSale[]
  cancelledSav: ServiceAfterSale[]
  onSelectSav: (id: string) => void
  getStatusBadge: (status: string) => JSX.Element
}

export function SavOverview({
  afterSales,
  waitingSav,
  pendingSav,
  completedSav,
  cancelledSav,
  onSelectSav,
  getStatusBadge
}: SavOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Statistiques */}
      {/* Badge principal - Total demandes (1,5 colonnes) */}
      <div className="md:col-span-2 lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <BsHeadset className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium">Total SAV</h3>
              <p className="text-2xl font-bold">{afterSales.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Badges secondaires (ultra compacts) */}
      <div className="bg-white shadow-sm rounded border border-gray-200 overflow-hidden">
        <div className="p-3">
          <div className="flex items-center space-x-1">
            <div className="p-0.5 rounded-full bg-orange-100 text-orange-600">
              <BsExclamationTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-medium leading-none">En attente</h3>
              <p className="text-lg font-bold leading-none mt-3">{waitingSav.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded border border-gray-200 overflow-hidden">
        <div className="p-3">
          <div className="flex items-center space-x-1">
            <div className="p-0.5 rounded-full bg-yellow-100 text-yellow-600">
              <BsClock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-medium leading-none">En cours</h3>
              <p className="text-lg font-bold leading-none mt-3">{pendingSav.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded border border-gray-200 overflow-hidden">
        <div className="p-3">
          <div className="flex items-center space-x-1">
            <div className="p-0.5 rounded-full bg-green-100 text-green-600">
              <BsClipboardCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-medium leading-none">Terminées</h3>
              <p className="text-lg font-bold leading-none mt-3">{completedSav.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded border border-gray-200 overflow-hidden">
        <div className="p-3">
          <div className="flex items-center space-x-1">
            <div className="p-0.5 rounded-full bg-red-100 text-red-600">
              <BsX className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-medium leading-none">Annulées</h3>
              <p className="text-lg font-bold leading-none mt-3">{cancelledSav.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dernières demandes */}
      <div className="md:col-span-4 lg:col-span-6 bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium">Dernières demandes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enregistré par</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {afterSales.slice(0, 5).map((sav) => (
                <tr key={sav.$id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSelectSav(sav.$id)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sav.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sav.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sav.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(sav.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sav.user_seller || 'Non défini'}</td>
                </tr>
              ))}
              
              {afterSales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Aucune demande SAV trouvée</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
