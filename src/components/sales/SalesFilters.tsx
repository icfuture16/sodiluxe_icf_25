'use client'

import { useState, useEffect } from 'react'
import { useStores } from '@/hooks/useStores'
import { Store } from '@/types/appwrite.types'

interface DateRange {
  startDate: Date | null
  endDate: Date | null
}

interface AmountFilter {
  min: string
  max: string
}

interface SalesFiltersProps {
  storeFilter: string | null
  setStoreFilter: (storeId: string | null) => void
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  statusFilter: string | null
  setStatusFilter: (status: string | null) => void
  paymentMethodFilter: string | null
  setPaymentMethodFilter: (method: string | null) => void
  amountFilter: AmountFilter
  setAmountFilter: (filter: AmountFilter) => void
  resetFilters: () => void
}

export default function SalesFilters({
  storeFilter,
  setStoreFilter,
  dateRange,
  setDateRange,
  statusFilter,
  setStatusFilter,
  paymentMethodFilter,
  setPaymentMethodFilter,
  amountFilter,
  setAmountFilter,
  resetFilters
}: SalesFiltersProps) {
  // Récupérer les magasins pour le filtre
  const { data: stores } = useStores()
  
  // États locaux pour les dates (pour l'affichage)
  const [startDateInput, setStartDateInput] = useState<string>('')
  const [endDateInput, setEndDateInput] = useState<string>('')
  
  // Mettre à jour les champs de date lorsque dateRange change
  useEffect(() => {
    if (dateRange.startDate) {
      setStartDateInput(dateRange.startDate.toISOString().split('T')[0])
    } else {
      setStartDateInput('')
    }
    
    if (dateRange.endDate) {
      setEndDateInput(dateRange.endDate.toISOString().split('T')[0])
    } else {
      setEndDateInput('')
    }
  }, [dateRange])
  
  // Gestionnaire de changement pour la date de début
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value ? new Date(e.target.value) : null
    setStartDateInput(e.target.value)
    setDateRange({ ...dateRange, startDate: newStartDate })
  }
  
  // Gestionnaire de changement pour la date de fin
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value ? new Date(e.target.value) : null
    setEndDateInput(e.target.value)
    setDateRange({ ...dateRange, endDate: newEndDate })
  }
  
  // Gestionnaire pour le changement du filtre de montant minimum
  const handleMinAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountFilter({ ...amountFilter, min: e.target.value })
  }
  
  // Gestionnaire pour le changement du filtre de montant maximum
  const handleMaxAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountFilter({ ...amountFilter, max: e.target.value })
  }
  
  return (
    <div className="bg-gray-50 p-4 rounded-md mb-6">
      <h2 className="text-lg font-semibold mb-4">Filtrer les ventes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Filtre par magasin */}
        <div>
          <label htmlFor="storeFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Magasin
          </label>
          <select
            id="storeFilter"
            value={storeFilter || ''}
            onChange={(e) => setStoreFilter(e.target.value || null)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Tous les magasins</option>
            {stores?.map((store: Store) => (
              <option key={store.$id} value={store.$id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Filtre par statut */}
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            id="statusFilter"
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Tous les statuts</option>
            <option value="completed">Complété</option>
            <option value="pending">En attente</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
        
        {/* Filtre par méthode de paiement */}
        <div>
          <label htmlFor="paymentMethodFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Méthode de paiement
          </label>
          <select
            id="paymentMethodFilter"
            value={paymentMethodFilter || ''}
            onChange={(e) => setPaymentMethodFilter(e.target.value || null)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Toutes les méthodes</option>
            <option value="cash">Espèces</option>
            <option value="card">Carte bancaire</option>
            <option value="transfer">Virement</option>
            <option value="check">Chèque</option>
          </select>
        </div>
        
        {/* Filtre par date de début */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date de début
          </label>
          <input
            type="date"
            id="startDate"
            value={startDateInput}
            onChange={handleStartDateChange}
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        {/* Filtre par date de fin */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date de fin
          </label>
          <input
            type="date"
            id="endDate"
            value={endDateInput}
            onChange={handleEndDateChange}
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        {/* Filtre par montant */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Montant min
            </label>
            <input
              type="number"
              id="minAmount"
              value={amountFilter.min}
              onChange={handleMinAmountChange}
              className="w-full p-2 border rounded-md"
              placeholder="Min"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Montant max
            </label>
            <input
              type="number"
              id="maxAmount"
              value={amountFilter.max}
              onChange={handleMaxAmountChange}
              className="w-full p-2 border rounded-md"
              placeholder="Max"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors mr-2"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  )
}
