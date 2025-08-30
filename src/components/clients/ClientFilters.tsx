'use client'

import { useState, useEffect } from 'react'
import { ClientSearchFilters } from '@/types/client.types'
import { FiSearch, FiX } from 'react-icons/fi'
import { useDebounce } from '@/hooks/useDebounce'

interface ClientFiltersProps {
  filters: ClientSearchFilters
  onFiltersChange: (filters: ClientSearchFilters) => void
  clientsCount: number
}

export default function ClientFilters({ filters, onFiltersChange, clientsCount }: ClientFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '')
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Mettre à jour les filtres lorsque les valeurs changent
  useEffect(() => {
    // Vérifier si les filtres ont réellement changé pour éviter les boucles infinies
    if (debouncedSearchTerm !== filters.searchTerm) {
      onFiltersChange({
        searchTerm: debouncedSearchTerm
      })
    }
  }, [debouncedSearchTerm, filters.searchTerm, onFiltersChange])

  // Fonction handleSegmentToggle retirée car les segments ne sont plus utilisés

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Recherche par nom/email/téléphone */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un client (par nom, contact, carte fidélité, etc)"
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {searchTerm && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Segments retirés - plus de filtres par segment */}
        {/* Filtre VIP uniquement retiré selon les spécifications */}
      </div>
    </div>
  )
}