'use client'

import { ServiceAfterSale } from './types'
import { BsArrowLeft } from 'react-icons/bs'
import { InterventionTracking } from './InterventionTracking'

interface SavDetailsProps {
  selectedSav: ServiceAfterSale | null
  onBack: () => void
  getStatusBadge: (status: string) => JSX.Element
  onMarkAsCompleted?: (id: string) => void
  onSavUpdate?: (updatedSav: ServiceAfterSale) => void
}

export function SavDetails({
  selectedSav,
  onBack,
  getStatusBadge,
  onMarkAsCompleted,
  onSavUpdate
}: SavDetailsProps) {
  if (!selectedSav) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden p-6">
        <p className="text-center text-gray-500">Aucune demande sélectionnée</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-3 p-1 rounded-full hover:bg-gray-100"
            aria-label="Retour"
          >
            <BsArrowLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-medium">Détails de la demande SAV</h3>
        </div>
        <div>{getStatusBadge(selectedSav.status)}</div>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Client</h4>
            <p className="text-base">{selectedSav.clientName}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Boutique</h4>
            <p className="text-base">{selectedSav.storeName}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Produit</h4>
            <p className="text-base">{selectedSav.productName}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Date de création</h4>
            <p className="text-base">{new Date(selectedSav.date).toLocaleDateString()}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Enregistré par</h4>
            <p className="text-base">{selectedSav.user_seller || 'Non défini'}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Date de récupération estimée</h4>
            <p className="text-base">
              {selectedSav.estimatedCompletionDate ? new Date(selectedSav.estimatedCompletionDate).toLocaleDateString() : 'Non définie'}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Type de problème</h4>
            <p className="text-base capitalize">{selectedSav.issueType}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Priorité</h4>
            <p className="text-base capitalize">{selectedSav.priority}</p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Description du problème</h4>
          <p className="text-base whitespace-pre-line">{selectedSav.issueDescription}</p>
        </div>
        
        {selectedSav.notes && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Notes additionnelles</h4>
            <p className="text-base whitespace-pre-line">{selectedSav.notes}</p>
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-6">
          <InterventionTracking 
            sav={selectedSav} 
            onUpdate={updatedSav => {
              if (onSavUpdate) onSavUpdate(updatedSav)
            }} 
          />
        </div>
      </div>
    </div>
  )
}
