'use client'

import { useState } from 'react'
import { useStores } from '@/hooks/useStores'
import { useSalesCountForStore } from '@/hooks/useSalesCount'
import { useCreditSales } from '@/hooks'
import { useDebtorSalesData } from '@/hooks/useDebtorSalesData'
import Link from 'next/link'
import { BsShop, BsClockHistory, BsPlusCircle } from 'react-icons/bs'
import { FiShoppingCart, FiPieChart, FiCreditCard, FiShoppingBag } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import NewSaleModal from '@/components/sales/NewSaleModal'
import NewDebitSaleModal from '@/components/sales/NewDebitSaleModal'

import SalesAnalytics from '@/components/sales/SalesAnalytics'
import { OfflineFallback } from '@/components/feedback/OfflineFallback'
import { useOffline } from '@/providers/OfflineProvider'
import { useOfflineData } from '@/hooks/useOfflineData'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { Store } from '@/types/appwrite.types'
import PageProtection from '@/components/auth/PageProtection'
import { useAuth } from '@/hooks/useAuth'

interface StoreCardProps {
  id: string
  name: string
  brand?: string
  address?: string
  city?: string
  type?: string
}

// Composant pour afficher une carte de magasin (ventes directes)
function StoreCard({ id, name, address }: StoreCardProps) {
  const router = useRouter()
  const [showNewSaleModal, setShowNewSaleModal] = useState(false)
  const [showDebitSaleModal, setShowDebitSaleModal] = useState(false)

  const { data: salesCount, isLoading: isLoadingSalesCount } = useSalesCountForStore(id)
  
  return (
    <div className="bg-white rounded-lg shadow-md p-5 mb-4 relative hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-3 bg-primary/10 rounded-full mr-4">
            <BsShop className="text-primary text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            {address && <p className="text-gray-500 text-sm">{address}</p>}
          </div>
        </div>
        
        {/* Badge pour afficher le nombre de ventes */}
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          {isLoadingSalesCount ? (
            <span className="animate-pulse">...</span>
          ) : (
            <span>{salesCount} vente{salesCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button 
          onClick={() => setShowNewSaleModal(true)}
          className="flex items-center justify-center gap-2 p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
        >
          <BsPlusCircle />
          <span>Vente directe</span>
        </button>
        
        <button 
          onClick={() => setShowDebitSaleModal(true)}
          className="flex items-center justify-center gap-2 p-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
        >
          <FiCreditCard />
          <span>Vente débitrice</span>
        </button>
      </div>
      
      {showNewSaleModal && (
        <NewSaleModal 
          storeId={id} 
          storeName={name} 
          isOpen={showNewSaleModal} 
          onClose={() => setShowNewSaleModal(false)} 
        />
      )}
      
      {showDebitSaleModal && (
        <NewDebitSaleModal
          storeId={id} 
          storeName={name} 
          isOpen={showDebitSaleModal} 
          onClose={() => setShowDebitSaleModal(false)} 
        />
      )}
      

    </div>
  )
}

// Composant pour afficher une carte de magasin (ventes débitrices)
function DebitStoreCard({ id, name, address }: StoreCardProps) {
  const { data: debtorData } = useDebtorSalesData({ storeId: id })
  const { data: salesCount } = useSalesCountForStore(id)
  const debitCount = debtorData?.debtorSales?.length || 0
  const directCount = salesCount || 0
  
  return (
    <Link 
      href={`/ventes/historique?storeId=${id}`}
      className="block bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl shadow-lg p-6 mb-4 relative hover:shadow-xl hover:from-indigo-100 hover:to-blue-100 hover:border-indigo-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <div className="p-3 bg-indigo-500/10 rounded-xl mr-4 border border-indigo-200">
            <BsShop className="text-indigo-600 text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
            {address && <p className="text-gray-600 text-sm mt-1">{address}</p>}
          </div>
        </div>
        
        {/* Rectangles colorés pour les ventes */}
        <div className="flex flex-col gap-2 ml-4">
          {/* Rectangle vert pour les ventes directes */}
          <div className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium shadow-sm flex items-center gap-1">
            <FiShoppingBag className="text-xs" />
            <span>{directCount}</span>
          </div>
          
          {/* Rectangle orange pour les ventes débitrices */}
          <div className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-medium shadow-sm flex items-center gap-1">
            <FiCreditCard className="text-xs" />
            <span>{debitCount}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Fonction pour récupérer les magasins directement (utilisée par useOfflineData)
export async function fetchStores() {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.STORES,
      [Query.limit(100)]
    )
    return response.documents
  } catch (error) {
    console.error("Erreur lors de la récupération des magasins:", error)
    return []
  }
}

// Composant principal pour la page des ventes
export default function VentesClient() {
  // Utiliser le hook useStores pour récupérer les magasins
  const { data: stores, isLoading, error } = useStores()
  const { userProfile } = useAuth()
  
  // État pour filtrer les magasins par marque
  const [brandFilter, setBrandFilter] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'stores' | 'analytics' | 'debit-sales'>('stores')
  
  // Vérifier si l'application est en mode hors ligne
  const { isOffline } = useOffline()
  
  // Récupérer les données hors ligne si nécessaire
  const { data: offlineStores, isLoading: isLoadingOffline } = useOfflineData({
    cacheKey: 'stores',
    fetchData: fetchStores
  })
  
  // Déterminer les magasins à afficher (en ligne ou hors ligne)
  const storeData = isOffline ? offlineStores : stores
  
  // S'assurer que storeData est traité comme un tableau de Store ou un tableau vide
  const typedStoreData = (storeData || []) as Store[]
  
  // Filtrer les magasins par marque si un filtre est sélectionné
  const filteredStores = brandFilter
    ? typedStoreData.filter(store => store.brand === brandFilter)
    : typedStoreData
  
  return (
    <PageProtection>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Gestion des ventes</h1>
        
        {/* Onglets */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium text-sm flex items-center ${
              activeTab === 'stores' 
                ? 'border-b-2 border-indigo-500 text-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('stores')}
          >
            Nouvelle vente
            <FiShoppingCart className="ml-2" />
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm flex items-center ${
              activeTab === 'debit-sales' 
                ? 'border-b-2 border-indigo-500 text-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('debit-sales')}
          >
            Historique des ventes
            <FiCreditCard className="ml-2" />
          </button>
          {userProfile?.role === 'admin' && (
            <button
              className={`py-2 px-4 font-medium text-sm flex items-center ${
                activeTab === 'analytics' 
                  ? 'border-b-2 border-indigo-500 text-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('analytics')}
            >
              Analyses
              <FiPieChart className="ml-2" />
            </button>
          )}
        </div>
        
        {isLoading || isLoadingOffline ? (
          <div className="flex justify-center my-12">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6">
                <div className="h-20 bg-slate-200 rounded"></div>
                <div className="h-20 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <OfflineFallback>
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p>Erreur lors du chargement des magasins. Veuillez réessayer.</p>
              <Link href="/ventes" className="text-red-700 underline mt-2 inline-block">
                Réessayer
              </Link>
            </div>
          </OfflineFallback>
        ) : (
          activeTab === 'stores' ? (
            <div>
              <div className="flex mb-6 space-x-4">
                <button
                  onClick={() => setBrandFilter(null)}
                  className={`px-4 py-2 rounded-md ${
                    brandFilter === null
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setBrandFilter('sillage')}
                  className={`px-4 py-2 rounded-md ${
                    brandFilter === 'sillage'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Sillage
                </button>
                <button
                  onClick={() => setBrandFilter('gemaber')}
                  className={`px-4 py-2 rounded-md ${
                    brandFilter === 'gemaber'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Gemaber
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores && filteredStores.length > 0 ? (
                  filteredStores.map((store: Store) => (
                    <StoreCard
                      key={store.$id}
                      id={store.$id}
                      name={store.name}
                      address={store.address || ''}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-10">
                    <p className="text-gray-500">Aucun magasin trouvé.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'debit-sales' ? (
            <div>
              <div className="flex mb-6 space-x-4">
                <button
                  onClick={() => setBrandFilter(null)}
                  className={`px-4 py-2 rounded-md ${
                    brandFilter === null
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setBrandFilter('sillage')}
                  className={`px-4 py-2 rounded-md ${
                    brandFilter === 'sillage'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Sillage
                </button>
                <button
                  onClick={() => setBrandFilter('gemaber')}
                  className={`px-4 py-2 rounded-md ${
                    brandFilter === 'gemaber'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Gemaber
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores && filteredStores.length > 0 ? (
                  filteredStores.map((store: Store) => (
                    <DebitStoreCard
                      key={store.$id}
                      id={store.$id}
                      name={store.name}
                      address={store.address || ''}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-10">
                    <p className="text-gray-500">Aucun magasin trouvé.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <SalesAnalytics />
          )
        )}
      </div>
    </PageProtection>
  )
}
