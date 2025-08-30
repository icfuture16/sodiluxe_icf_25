'use client'

import { FormEvent } from 'react'
import { ComboBox } from '@/components/ui/ComboBox'
import { StoreSelect } from '@/components/ui/StoreSelect'
import { SavFormData, ComboBoxOption } from './types'

interface NewSavRequestProps {
  savFormData: SavFormData
  handleSavFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleSavFormSubmit: (e: FormEvent) => void
  selectedStoreOption: ComboBoxOption | null
  setSelectedStoreOption: (option: ComboBoxOption | null) => void
  selectedClientOption: ComboBoxOption | null
  setSelectedClientOption: (option: ComboBoxOption | null) => void
  selectedProductOption: ComboBoxOption | null
  setSelectedProductOption: (option: ComboBoxOption | null) => void
  setClientQuery: (query: string) => void
  setProductQuery: (query: string) => void
  stores: any[]
  clients: any[]
  products: any[]
  onCancel: () => void
}

export function NewSavRequest({
  savFormData,
  handleSavFormChange,
  handleSavFormSubmit,
  selectedStoreOption,
  setSelectedStoreOption,
  selectedClientOption,
  setSelectedClientOption,
  selectedProductOption,
  setSelectedProductOption,
  setClientQuery,
  setProductQuery,
  stores,
  clients,
  products,
  onCancel
}: NewSavRequestProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium">Nouvelle demande SAV</h3>
      </div>
      <div className="p-6">
        <form onSubmit={handleSavFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={savFormData.date}
                onChange={handleSavFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            </div>
            
            {/* Boutique */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Boutique</label>
              <StoreSelect
                options={stores.map(store => ({ id: store.$id, label: store.name }))}
                value={selectedStoreOption}
                onChange={setSelectedStoreOption}
                placeholder="Sélectionner une boutique"
              />
            </div>
            
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Client</label>
              <ComboBox
                options={clients.map(client => ({ id: client.$id, label: client.fullName }))}
                value={selectedClientOption}
                onChange={setSelectedClientOption}
                placeholder="Rechercher un client"
                onInputChange={setClientQuery}
              />
            </div>
            
            {/* Produit */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Produit</label>
              <ComboBox
                options={products.map(product => ({ id: product.$id, label: product.name }))}
                value={selectedProductOption}
                onChange={setSelectedProductOption}
                placeholder="Rechercher un produit"
                onInputChange={setProductQuery}
              />
            </div>
            
            {/* Description du problème */}
            <div className="md:col-span-2">
              <label htmlFor="issueDescription" className="block text-sm font-medium text-gray-700">Description du problème</label>
              <textarea
                id="issueDescription"
                name="issueDescription"
                value={savFormData.issueDescription}
                onChange={handleSavFormChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            </div>
            

            {/* Date de récupération estimée */}
            <div>
              <label htmlFor="estimatedCompletionDate" className="block text-sm font-medium text-gray-700">Date de récupération estimée</label>
              <input
                type="date"
                id="estimatedCompletionDate"
                name="estimatedCompletionDate"
                value={savFormData.estimatedCompletionDate || ''}
                onChange={handleSavFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            
            {/* Type de problème */}
            <div>
              <label htmlFor="issueType" className="block text-sm font-medium text-gray-700">Type de problème</label>
              <select
                id="issueType"
                name="issueType"
                value={savFormData.issueType}
                onChange={handleSavFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              >
                <option value="réparation">Réparation</option>
                <option value="échange">Échange</option>
                <option value="remboursement">Remboursement</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            
            {/* Priorité */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priorité</label>
              <select
                id="priority"
                name="priority"
                value={savFormData.priority}
                onChange={handleSavFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              >
                <option value="high">Haute</option>
                <option value="medium">Normale</option>
                <option value="low">Basse</option>
              </select>
            </div>
            
            {/* Notes */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes additionnelles</label>
              <textarea
                id="notes"
                name="notes"
                value={savFormData.notes || ''}
                onChange={handleSavFormChange}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
