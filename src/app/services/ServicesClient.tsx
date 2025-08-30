'use client'

import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { generateUserSeller } from '@/lib/utils/sellerUtils'
import { useSavDebtorData } from '@/hooks/useSavDebtorData'
import { SavOverview } from './components/SavOverview'
import { NewSavRequest } from './components/NewSavRequest'
import { WaitingSavRequests } from './components/WaitingSavRequests'
import { PendingSavRequests } from './components/PendingSavRequests'
import { CompletedSavRequests } from './components/CompletedSavRequests'
import { CancelledSavRequests } from './components/CancelledSavRequests'
import { SavDetails } from './components/SavDetails'
import { InterventionTracking } from './components/InterventionTracking'
import { ServiceAfterSale, SavFormData, ComboBoxOption } from './components/types'

// Définition des constantes de collections
const SAV_COLLECTION_ID = COLLECTIONS.AFTER_SALES_SERVICE
const STORES_COLLECTION_ID = COLLECTIONS.STORES
const PRODUCTS_COLLECTION_ID = COLLECTIONS.PRODUCTS
const SELLERS_COLLECTION_ID = COLLECTIONS.USERS

export default function ServicesClient() {
  // Authentification utilisateur
  const { user, userProfile } = useAuth();
  // Navigation state
  const [savTab, setSavTab] = useState<'overview' | 'new' | 'waiting' | 'pending' | 'completed' | 'cancelled' | 'details'>('overview')
  
  // Utilisation du hook spécialisé pour les données SAV avec période fixe de 2 mois
  const { data: savDebtorData, isLoading: savDataLoading } = useSavDebtorData({
    storeId: undefined // Pas de filtre par magasin pour le moment
  })
  
  // Data states
  const [afterSales, setAfterSales] = useState<ServiceAfterSale[]>([])
  const [pendingSav, setPendingSav] = useState<ServiceAfterSale[]>([]);
  const [waitingSav, setWaitingSav] = useState<ServiceAfterSale[]>([]);
  const [completedSav, setCompletedSav] = useState<ServiceAfterSale[]>([]);
  const [cancelledSav, setCancelledSav] = useState<ServiceAfterSale[]>([]);
  const [selectedSav, setSelectedSav] = useState<ServiceAfterSale | null>(null)
  const [stores, setStores] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  // Technicien : plus de gestion locale, le technicien est l'utilisateur courant
// (aucune récupération de liste, aucun badge, aucun ComboBox technicien)

  const [clients, setClients] = useState<any[]>([])
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  
  // Form states
  const [savFormData, setSavFormData] = useState<SavFormData>({
    date: new Date().toISOString().split('T')[0],
    issueDescription: '',
    estimatedCompletionDate: '',
    notes: '',
    issueType: 'réparation',
    status: 'nouvelle',
    priority: 'medium'
  })
  
  // ComboBox states
  const [selectedStoreOption, setSelectedStoreOption] = useState<ComboBoxOption | null>(null)
  const [selectedClientOption, setSelectedClientOption] = useState<ComboBoxOption | null>(null)
  const [selectedProductOption, setSelectedProductOption] = useState<ComboBoxOption | null>(null)

  const [clientQuery, setClientQuery] = useState('')
  const [filteredClients, setFilteredClients] = useState<any[]>([])
  const [productQuery, setProductQuery] = useState('')

  // Effect to filter clients based on search query
  useEffect(() => {
    if (clientQuery.trim() === '') {
      setFilteredClients(clients)
    } else {
      const filtered = clients.filter(client =>
        client.fullName.toLowerCase().includes(clientQuery.toLowerCase()) ||
        client.phone.includes(clientQuery) ||
        client.email.toLowerCase().includes(clientQuery.toLowerCase())
      )
      setFilteredClients(filtered)
    }
  }, [clientQuery, clients])
  
  // Mise à jour des données SAV basées sur le hook avec période fixe de 2 mois
  useEffect(() => {
    if (savDebtorData?.serviceData) {
      const savData = savDebtorData.serviceData as ServiceAfterSale[]
      setAfterSales(savData)
      
      // Filter SAV requests by status
      const normalize = (status: string) => (status ?? '').toLowerCase().replace(/\s|_/g, '');
      const waiting = savData.filter(sav => ['nouvelle','enattente'].includes(normalize(sav.status)));
      const pending = savData.filter(sav => ['encours'].includes(normalize(sav.status)));
      const completed = savData.filter(sav => ['terminée','terminé','termine'].includes(normalize(sav.status)));
      const cancelled = savData.filter(sav => ['annulée','annule','annulee'].includes(normalize(sav.status)));
      
      setWaitingSav(waiting)
      setPendingSav(pending)
      setCompletedSav(completed)
      setCancelledSav(cancelled)
    }
  }, [savDebtorData])
  
  // Fetch additional data from Appwrite (stores, products, clients)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch stores
        const storesResponse = await databases.listDocuments(
          DATABASE_ID,
          STORES_COLLECTION_ID
        )
        setStores(storesResponse.documents)
        
        // Fetch products
        const productsResponse = await databases.listDocuments(
          DATABASE_ID,
          PRODUCTS_COLLECTION_ID
        )
        setProducts(productsResponse.documents)
        
        // Fetch clients from Appwrite
        try {
          const clientsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.CLIENTS
          )
          setClients(clientsResponse.documents)
          setFilteredClients(clientsResponse.documents)
        } catch (error) {
          console.error('Error fetching clients:', error)
          setClients([])
          setFilteredClients([])
        }
        
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(savDataLoading)
      }
    }
    
    fetchData()
  }, [savDataLoading])
  
  // Handle SAV form changes
  const handleSavFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSavFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle SAV form submission
  const handleSavFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!selectedStoreOption || !selectedClientOption || !selectedProductOption) {
      alert('Veuillez remplir tous les champs requis')
      return
    }
    
    try {
      // Générer le user_seller à partir du nom complet de l'utilisateur
      const fullName = userProfile?.fullName || user?.name || 'Utilisateur'
      const userSeller = generateUserSeller(fullName)
      
      // Création des données selon la structure mise à jour de la collection after_sales_service
      const newSavData = {
        date: savFormData.date,
        user_seller: userSeller,
        storeId: selectedStoreOption.id,
        storeName: selectedStoreOption.label,
        clientId: selectedClientOption.id,
        clientName: selectedClientOption.label,
        productId: selectedProductOption.id,
        productName: selectedProductOption.label,
        issueDescription: savFormData.issueDescription,
        estimatedCompletionDate: savFormData.estimatedCompletionDate,
        notes: savFormData.notes,
        issueType: savFormData.issueType,
        status: savFormData.status,
        priority: savFormData.priority
      }
      
      const response = await databases.createDocument(
        DATABASE_ID,
        SAV_COLLECTION_ID,
        'unique()',
        newSavData
      )
      
      // Add the new SAV to the state
      const newSav = response as unknown as ServiceAfterSale
      setAfterSales(prev => [newSav, ...prev])
      setPendingSav(prev => [newSav, ...prev])
      
      // Reset form
      setSavFormData({
        date: new Date().toISOString().split('T')[0],
        issueDescription: '',
        estimatedCompletionDate: '',
        notes: '',
        issueType: 'réparation',
        status: 'nouvelle',
        priority: 'medium'
      })
      
      setSelectedStoreOption(null)
      setSelectedClientOption(null)
      setSelectedProductOption(null)
      
      // Navigate back to overview
      setSavTab('overview')
      
      // Refresh data
      const savResponse = await databases.listDocuments(
        DATABASE_ID,
        SAV_COLLECTION_ID
      )
      const savData = savResponse.documents as unknown as ServiceAfterSale[]
      setAfterSales(savData)
      const normalize = (status: string) => (status ?? '').toLowerCase().replace(/\s|_/g, '');
      setPendingSav(savData.filter(sav => ['nouvelle','encours'].includes(normalize(sav.status))));
      setCompletedSav(savData.filter(sav => ['terminée','terminé','termine'].includes(normalize(sav.status))));
      
    } catch (error) {
      console.error('Error creating SAV request:', error)
      alert('Une erreur est survenue lors de la création de la demande SAV')
    }
  }
  
  // Handle marking a SAV request as completed
  const handleMarkAsCompleted = async (id: string) => {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        SAV_COLLECTION_ID,
        id,
        { 
          status: 'terminé',
          completionDate: new Date().toISOString().split('T')[0]
        }
      )
      
      // Update local state
      const updatedSav = response as unknown as ServiceAfterSale
      setAfterSales(prev => prev.map(sav => sav.$id === id ? updatedSav : sav))
      setPendingSav(prev => prev.filter(sav => sav.$id !== id))
      setCompletedSav(prev => [updatedSav, ...prev])
      
      if (selectedSav && selectedSav.$id === id) {
        setSelectedSav(updatedSav)
      }
    } catch (error) {
      console.error('Error marking SAV as completed:', error)
      alert('Une erreur est survenue lors de la mise à jour du statut')
    }
  }
  
  // Handle SAV update from intervention tracking
  const handleSavUpdate = async (updatedSav: ServiceAfterSale) => {
    try {
      // Update local state
      setAfterSales(prev => prev.map(sav => sav.$id === updatedSav.$id ? updatedSav : sav))
      
      // Update all lists based on status
      const normalize = (status: string) => (status ?? '').toLowerCase().replace(/\s|_/g, '');
      const normalizedStatus = normalize(updatedSav.status);
      
      // Remove from all lists first
      setWaitingSav(prev => prev.filter(sav => sav.$id !== updatedSav.$id))
      setPendingSav(prev => prev.filter(sav => sav.$id !== updatedSav.$id))
      setCompletedSav(prev => prev.filter(sav => sav.$id !== updatedSav.$id))
      setCancelledSav(prev => prev.filter(sav => sav.$id !== updatedSav.$id))
      
      // Add to appropriate list based on status
      if (['nouvelle','enattente'].includes(normalizedStatus)) {
        setWaitingSav(prev => [updatedSav, ...prev])
      } else if (['encours'].includes(normalizedStatus)) {
        setPendingSav(prev => [updatedSav, ...prev])
      } else if (['terminée','terminé','termine'].includes(normalizedStatus)) {
        setCompletedSav(prev => [updatedSav, ...prev])
      } else if (['annulée','annule','annulee'].includes(normalizedStatus)) {
        setCancelledSav(prev => [updatedSav, ...prev])
      }
      
      // Update selected SAV if it's the one being updated
      if (selectedSav && selectedSav.$id === updatedSav.$id) {
        setSelectedSav(updatedSav)
      }
    } catch (error) {
      console.error('Error updating SAV:', error)
      alert('Une erreur est survenue lors de la mise à jour de la demande')
    }
  }
  
  // Handle selecting a SAV request for details view
  const handleSelectSav = (id: string) => {
    const sav = afterSales.find(s => s.$id === id)
    if (sav) {
      setSelectedSav(sav)
      setSavTab('details')
    }
  }
  
  // Get status badge based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'nouvelle':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Nouvelle
          </span>
        )
      case 'en_attente':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
            En attente
          </span>
        )
      case 'en_cours':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            En cours
          </span>
        )
      case 'terminé':
      case 'terminée':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Terminé
          </span>
        )
      case 'annulée':
      case 'annulé':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Annulé
          </span>
        )
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }
  
  // Render functions for different tabs
  const renderSavContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }
    switch (savTab) {
      case 'overview':
        return (
          <SavOverview
            afterSales={afterSales}
            waitingSav={waitingSav}
            pendingSav={pendingSav}
            completedSav={completedSav}
            cancelledSav={cancelledSav}
            onSelectSav={handleSelectSav}
            getStatusBadge={getStatusBadge}
          />
        );
      case 'new':
        return (
          <NewSavRequest
            savFormData={savFormData}
            handleSavFormChange={handleSavFormChange}
            handleSavFormSubmit={handleSavFormSubmit}
            selectedStoreOption={selectedStoreOption}
            setSelectedStoreOption={setSelectedStoreOption}
            selectedClientOption={selectedClientOption}
            setSelectedClientOption={setSelectedClientOption}
            selectedProductOption={selectedProductOption}
            setSelectedProductOption={setSelectedProductOption}
            setClientQuery={setClientQuery}
            setProductQuery={setProductQuery}
            stores={stores}
            clients={clients}
            products={products}
            onCancel={() => setSavTab('overview')}
          />
        );
      case 'waiting':
        return (
          <WaitingSavRequests
            waitingSav={waitingSav}
            onSelectSav={handleSelectSav}
            getStatusBadge={getStatusBadge}
          />
        );
      case 'pending':
        return (
          <PendingSavRequests
            pendingSav={pendingSav}
            onSelectSav={handleSelectSav}
            getStatusBadge={getStatusBadge}
          />
        );
      case 'completed':
        return (
          <CompletedSavRequests
            completedSav={completedSav}
            onSelectSav={handleSelectSav}
            getStatusBadge={getStatusBadge}
          />
        );
      case 'cancelled':
        return (
          <CancelledSavRequests
            cancelledSav={cancelledSav}
            onSelectSav={handleSelectSav}
            getStatusBadge={getStatusBadge}
          />
        );
      case 'details':
        return (
          <SavDetails
            selectedSav={selectedSav}
            onBack={() => setSavTab('overview')}
            getStatusBadge={getStatusBadge}
            onMarkAsCompleted={handleMarkAsCompleted}
            onSavUpdate={handleSavUpdate}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="sm:hidden">
            <label htmlFor="sav-tabs" className="sr-only">
              Sélectionner un onglet SAV
            </label>
            <select
              id="sav-tabs"
              name="sav-tabs"
              className="block w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary"
              value={savTab}
              onChange={(e) => setSavTab(e.target.value as any)}
            >
              <option value="overview">Tableau de bord</option>
              <option value="new">Nouvelle demande</option>
              <option value="pending">En cours</option>
              <option value="completed">Terminées</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="flex space-x-4" aria-label="Tabs">
              <button
                onClick={() => setSavTab('overview')}
                className={`${
                  savTab === 'overview'
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-500 hover:text-gray-700'
                } px-3 py-2 font-medium text-sm rounded-md`}
              >
                Tableau de bord
              </button>
              <button
                onClick={() => setSavTab('new')}
                className={`${
                  savTab === 'new'
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-500 hover:text-gray-700'
                } px-3 py-2 font-medium text-sm rounded-md`}
              >
                Nouvelle demande
              </button>
              <button
                onClick={() => setSavTab('waiting')}
                className={`${
                  savTab === 'waiting'
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-500 hover:text-gray-700'
                } px-3 py-2 font-medium text-sm rounded-md`}
              >
                En attente ({waitingSav.length})
              </button>
              <button
                onClick={() => setSavTab('pending')}
                className={`${
                  savTab === 'pending'
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-500 hover:text-gray-700'
                } px-3 py-2 font-medium text-sm rounded-md`}
              >
                En cours ({pendingSav.length})
              </button>
              <button
                onClick={() => setSavTab('completed')}
                className={`${
                  savTab === 'completed'
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-500 hover:text-gray-700'
                } px-3 py-2 font-medium text-sm rounded-md`}
              >
                Terminées ({completedSav.length})
              </button>
              <button
                onClick={() => setSavTab('cancelled')}
                className={`${
                  savTab === 'cancelled'
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-500 hover:text-gray-700'
                } px-3 py-2 font-medium text-sm rounded-md`}
              >
                Annulées ({cancelledSav.length})
              </button>
            </nav>
          </div>
        </div>
        {renderSavContent()}
      </div>
    </div>
  );
}
