'use client'

import { useState, useEffect, useCallback } from 'react'
import { ReservationFilters } from '@/types/reservation.types'
import { FiFilter, FiCalendar, FiMapPin, FiTag, FiSearch } from 'react-icons/fi'
import { useStores } from '@/hooks/useStores'
import { Store } from '@/types/appwrite.types';

interface ReservationFiltersProps {
  filters: ReservationFilters
  onFilterChange: (filters: ReservationFilters) => void
  stores: Store[]; // Add stores prop
}

export default function ReservationFiltersComponent({
  filters,
  onFilterChange,
  stores // Destructure stores prop
}: ReservationFiltersProps) {
  const [storeId, setStoreId] = useState<string | undefined>(filters.storeId)
  const [status, setStatus] = useState<('active' | 'confirmed' | 'completed')[] | undefined>(filters.status)
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>(
    filters.dateRange || {}
  )
  const [clientSearch, setClientSearch] = useState<string | undefined>(filters.clientSearch)
  const [isExpanded, setIsExpanded] = useState(false)

  // Mettre à jour les filtres lorsque les états locaux changent
  // Utiliser useCallback pour mémoriser la fonction de mise à jour des filtres
  const updateFilters = useCallback(() => {
    const newFilters: ReservationFilters = {}
    
    if (storeId) newFilters.storeId = storeId
    if (status && status.length > 0) newFilters.status = status
    
    if (dateRange?.start || dateRange?.end) {
      newFilters.dateRange = {
        start: dateRange.start || '',
        end: dateRange.end || ''
      }
    }
    if (clientSearch) newFilters.clientSearch = clientSearch

    onFilterChange(newFilters)
  }, [storeId, status, dateRange, clientSearch, onFilterChange])
  
  // Appliquer les filtres lorsque les dépendances changent
  useEffect(() => {
    updateFilters()
  }, [updateFilters])

  const handleStatusChange = (selectedStatus: 'active' | 'confirmed' | 'completed') => {
    if (!status) {
      setStatus([selectedStatus])
      return
    }

    if (status.includes(selectedStatus)) {
      setStatus(status.filter(s => s !== selectedStatus))
    } else {
      setStatus([...status, selectedStatus])
    }
  }

  const clearFilters = () => {
    setStoreId(undefined)
    setStatus(undefined)
    setDateRange({})
    setClientSearch(undefined)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <FiFilter className="h-5 w-5 text-primary" />
          Filtres
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary hover:text-primary/80"
        >
          {isExpanded ? 'Réduire' : 'Plus de filtres'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recherche client */}
        <div>
          <label htmlFor="client-search" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <FiSearch className="h-4 w-4" />
            Client
          </label>
          <input
            type="text"
            id="client-search"
            value={clientSearch || ''}
            onChange={(e) => setClientSearch(e.target.value || undefined)}
            placeholder="Rechercher un client..."
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
          />
        </div>

        {/* Sélection de magasin */}
        <div>
          <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <FiMapPin className="h-4 w-4" />
            Magasin
          </label>
          <select
            id="store-select"
            value={storeId || ''}
            onChange={(e) => setStoreId(e.target.value || undefined)}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
          >
            <option value="">Tous les magasins</option>
            {stores?.map(store => (
              <option key={store.$id} value={store.$id}>{store.name}</option>
            ))}
          </select>
        </div>

        {/* Sélection de statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <FiTag className="h-4 w-4" />
            Statut
          </label>
          <div className="flex flex-wrap gap-2">
            {['active', 'confirmed', 'completed'].map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s as 'active' | 'confirmed' | 'completed')}
                className={`px-2 py-1 rounded-md text-xs font-medium ${status?.includes(s as 'active' | 'confirmed' | 'completed') ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {s === 'active' && 'Active'}
                {s === 'confirmed' && 'Confirmée'}
                {s === 'completed' && 'Terminée'}
              </button>
            ))}
          </div>
        </div>

        {/* Sélection de date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <FiCalendar className="h-4 w-4" />
            Période
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={dateRange?.start || ''}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value || undefined })}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
            <input
              type="date"
              value={dateRange?.end || ''}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value || undefined })}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
          </div>
        </div>
      </div>

      {/* Bouton de réinitialisation */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={clearFilters}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  )
}