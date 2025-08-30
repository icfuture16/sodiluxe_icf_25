'use client'

import { ServiceAfterSale } from './types'

interface PendingSavRequestsProps {
  pendingSav: ServiceAfterSale[]
  onSelectSav: (id: string) => void
  getStatusBadge: (status: string) => JSX.Element
}

export function PendingSavRequests({
  pendingSav,
  onSelectSav,
  getStatusBadge
}: PendingSavRequestsProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium">Demandes en cours</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Problème</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enregistré par</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de récupération</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pendingSav.map((sav) => (
              <tr key={sav.$id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSelectSav(sav.$id)}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sav.clientName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sav.productName}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="max-w-xs truncate">{sav.issueDescription}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(sav.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sav.user_seller || 'Non défini'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sav.estimatedCompletionDate ? new Date(sav.estimatedCompletionDate).toLocaleDateString() : 'Non définie'}
                </td>
              </tr>
            ))}
            
            {pendingSav.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Aucune demande en cours</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
