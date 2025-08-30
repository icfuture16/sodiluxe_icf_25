'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useStores, useCreateStore, useUpdateStore, useDeleteStore } from '@/hooks/useStores'
import { Store } from '@/types/appwrite.types'
import { useToast } from '@/components/ui/use-toast'
import { AccessCodeCheck } from '@/components/ui/access-code-check'
import PageProtection from '@/components/auth/PageProtection'

interface StoreFormData {
  name: string
  address: string
  phone: string
  isActive?: boolean
  brand?: 'sillage' | 'gemaber' | 'autre'
}

export default function StoresClient() {
  const { data: stores, isLoading } = useStores()
  const createStore = useCreateStore()
  const updateStore = useUpdateStore()
  const deleteStore = useDeleteStore()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentStore, setCurrentStore] = useState<Store | null>(null)
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    address: '',
    phone: '',
    isActive: true,
    brand: 'gemaber'
  })
  const { toast } = useToast()

  // Réinitialiser le formulaire lorsque le modal est ouvert/fermé
  useEffect(() => {
    if (!isModalOpen) {
      setFormData({ 
        name: '', 
        address: '', 
        phone: '',
        isActive: true,
        brand: 'gemaber'
      })
      setCurrentStore(null)
    }
  }, [isModalOpen])

  // Remplir le formulaire avec les données du magasin à éditer
  useEffect(() => {
    if (currentStore) {
      setFormData({
        name: currentStore.name,
        address: currentStore.address,
        phone: currentStore.phone,
        isActive: currentStore.isActive,
        brand: currentStore.brand as 'sillage' | 'gemaber' | 'autre'
      })
    }
  }, [currentStore])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (currentStore) {
        // Mise à jour d'un magasin existant
        await updateStore.mutateAsync({
          id: currentStore.$id,
          data: formData
        })
        toast({
          title: 'Magasin mis à jour',
          description: `Le magasin ${formData.name} a été mis à jour avec succès.`,
        })
      } else {
        // Création d'un nouveau magasin
        await createStore.mutateAsync({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          isActive: formData.isActive ?? true,
          brand: formData.brand ?? 'gemaber'
        })
        toast({
          title: 'Magasin créé',
          description: `Le magasin ${formData.name} a été créé avec succès.`,
        })
      }
      
      // Fermer le modal
      setIsModalOpen(false)
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue: ${error.message}`,
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!currentStore) return
    
    try {
      await deleteStore.mutateAsync(currentStore.$id)
      toast({
        title: 'Magasin supprimé',
        description: `Le magasin ${currentStore.name} a été supprimé avec succès.`,
      })
      setIsDeleteModalOpen(false)
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue: ${error.message}`,
        variant: 'destructive'
      })
    }
  }

  const openEditModal = (store: Store) => {
    setCurrentStore(store)
    setIsModalOpen(true)
  }

  const openDeleteModal = (store: Store) => {
    setCurrentStore(store)
    setIsDeleteModalOpen(true)
  }

  return (
    <PageProtection>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-secondary">Gestion des Boutiques</h1>
        <AccessCodeCheck 
          toastMessage="Code d'accès incorrect. Vous n'avez pas les droits nécessaires pour ajouter une boutique."
          onAuthorizedClick={() => setIsModalOpen(true)}
        >
          <>
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Ajouter une boutique
          </>
        </AccessCodeCheck>
      </div>

      {/* Liste des boutiques */}
      <div className="bg-white shadow-sm ring-1 ring-primary/5 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adresse
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Téléphone
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marque
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : stores && stores.length > 0 ? (
              stores.map((store) => (
                <tr key={store.$id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {store.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {store.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {store.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {store.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {store.brand || 'Non défini'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end">
                      <AccessCodeCheck 
                        toastMessage="Code d'accès incorrect. Vous n'avez pas les droits nécessaires pour modifier une boutique."
                        onAuthorizedClick={() => openEditModal(store)}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </AccessCodeCheck>
                      <span className="mx-2"></span>
                      <AccessCodeCheck 
                        toastMessage="Code d'accès incorrect. Vous n'avez pas les droits nécessaires pour supprimer une boutique."
                        onAuthorizedClick={() => openDeleteModal(store)}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </AccessCodeCheck>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucune boutique trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal d'ajout/édition de boutique */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {currentStore ? 'Modifier la boutique' : 'Ajouter une boutique'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Adresse
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Téléphone
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                  Marque
                </label>
                <select
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="gemaber">Gemaber</option>
                  <option value="sillage">Sillage</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Boutique active
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  disabled={createStore.isPending || updateStore.isPending}
                >
                  {(createStore.isPending || updateStore.isPending) ? 'Chargement...' : currentStore ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {isDeleteModalOpen && currentStore && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirmer la suppression</h2>
            <p className="mb-4">
              Êtes-vous sûr de vouloir supprimer la boutique <strong>{currentStore.name}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={deleteStore.isPending}
              >
                {deleteStore.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PageProtection>
  )
}
