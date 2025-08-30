'use client'

// Ce fichier contient l'implémentation du composant client pour la page clients
// pour éviter les problèmes de prérendering sur Netlify

import { useState, useEffect, Suspense } from 'react'
import { useCachedClients } from '@/hooks/useCachedClients'
import ClientList from '@/components/clients/ClientList'
import ClientFilters from '@/components/clients/ClientFilters'
import ClientAnalytics from '@/components/clients/ClientAnalytics'
import ClientDetailModal from '@/components/clients/ClientDetailModal'
import { Client, ClientSearchFilters } from '@/types/client.types'
import { FiUserPlus, FiUsers, FiPieChart } from 'react-icons/fi'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
const NewClientModal = dynamic(() => import('@/components/clients/NewClientModal'), {
  ssr: false
})

// Composant qui utilise useSearchParams, doit être enveloppé dans Suspense
function ClientsContent() {
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list')
  const searchParams = useSearchParams()
  const { userProfile } = useAuth()
  const [filters, setFilters] = useState<ClientSearchFilters>({
    searchTerm: '',
    segment: []
  })
  
  // Vérifier si nous devons ouvrir le modal d'ajout de client automatiquement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldOpenNewClientModal = searchParams.get('newClient') === 'true'
      if (shouldOpenNewClientModal) {
        setIsNewClientModalOpen(true)
      }
    }
  }, [searchParams])

  const { data: clients, isLoading, error } = useCachedClients(filters)

  const handleFilterChange = (newFilters: ClientSearchFilters) => {
    // Prevent unnecessary re-renders by checking if filters actually changed
    if (JSON.stringify(filters) !== JSON.stringify(newFilters)) {
      setFilters(newFilters)
    }
  }

  const openNewClientModal = () => {
    setIsNewClientModalOpen(true)
  }

  const closeNewClientModal = () => {
    setIsNewClientModalOpen(false)
  }

  const closeDetailModal = () => {
    setSelectedClient(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Clients</h1>
        <button
          onClick={openNewClientModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <FiUserPlus className="h-5 w-5" />
          Nouveau Client
        </button>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm flex items-center ${activeTab === 'list' 
            ? 'border-b-2 border-indigo-500 text-indigo-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('list')}
        >
          <FiUsers className="mr-2" />
          Liste des clients
        </button>
        {userProfile?.role === 'admin' && (
          <button
            className={`py-2 px-4 font-medium text-sm flex items-center ${activeTab === 'analytics' 
              ? 'border-b-2 border-indigo-500 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FiPieChart className="mr-2" />
            Analyses
          </button>
        )}
      </div>

      {activeTab === 'list' && (
        <>
          <ClientFilters filters={filters} onFiltersChange={handleFilterChange} clientsCount={0} />

          <ClientList 
            clients={clients || []} 
            isLoading={isLoading} 
            error={error} 
            filters={filters}
          />
        </>
      )}

      {activeTab === 'analytics' && userProfile?.role === 'admin' && (
        <ClientAnalytics />
      )}

      <NewClientModal
        open={isNewClientModalOpen}
        onClose={closeNewClientModal}
      />

      <ClientDetailModal
        isOpen={!!selectedClient}
        onClose={closeDetailModal}
        client={selectedClient}
      />
    </div>
  )
}

// Composant wrapper qui exporte et enveloppe le contenu dans Suspense
export default function ClientsPageContent() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Chargement...</div>}>
      <ClientsContent />
    </Suspense>
  )
}
