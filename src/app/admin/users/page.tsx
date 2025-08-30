'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, UserInput } from '@/hooks/useUsers'
import { User } from '@/types/appwrite.types'
import { useToast } from '@/components/ui/use-toast'
import { useStores } from '@/hooks/useStores'
import { useAuth } from '@/hooks/useAuth'
import { generateRandomString } from '@/utils/randomString'
import { useAllSellerStats, formatCurrency } from '@/hooks/useAllSellerStats'

interface UserFormData {
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'seller'
  storeId: string
}

export default function UsersAdminPage() {
  const { data: users, isLoading, refetch } = useUsers()
  const { data: stores } = useStores()
  const { sellerStats, topSellers, riskSellers, isLoading: statsLoading, isMounted } = useAllSellerStats()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    fullName: '',
    role: 'seller',
    storeId: ''
  })
  const [confirmationString, setConfirmationString] = useState('')
  const [userConfirmationInput, setUserConfirmationInput] = useState('')
  const { toast } = useToast()
  const { userProfile } = useAuth()

  // Réinitialiser le formulaire lorsque le modal est ouvert/fermé
  useEffect(() => {
    if (!isModalOpen) {
      setFormData({ email: '', fullName: '', role: 'seller', storeId: '' })
      setCurrentUser(null)
    }
  }, [isModalOpen])

  // Remplir le formulaire avec les données de l'utilisateur à éditer
  useEffect(() => {
    if (currentUser) {
      setFormData({
        email: currentUser.email,
        fullName: currentUser.fullName,
        role: currentUser.role,
        storeId: currentUser.storeId
      })
    }
  }, [currentUser])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (currentUser) {
        // Mise à jour d'un utilisateur existant
        await updateUser.mutateAsync({
          id: currentUser.$id,
          updates: formData
        })
        toast({
          title: 'Utilisateur mis à jour',
          description: `L'utilisateur ${formData.fullName} a été mis à jour avec succès.`,
        })
      } else {
        // Création d'un nouvel utilisateur
        await createUser.mutateAsync(formData)
        toast({
          title: 'Utilisateur créé',
          description: `L'utilisateur ${formData.fullName} a été créé avec succès.`,
        })
      }
      
      // Fermer le modal et rafraîchir la liste
      setIsModalOpen(false)
      refetch()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue: ${error.message}`,
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!currentUser) return
    
    // Vérifier que la chaîne de confirmation est correcte
    if (userConfirmationInput !== confirmationString) {
      toast({
        title: 'Confirmation incorrecte',
        description: 'Veuillez saisir exactement la chaîne de confirmation affichée.',
        variant: 'destructive'
      })
      return
    }
    
    try {
      await deleteUser.mutateAsync(currentUser.$id)
      toast({
        title: 'Utilisateur supprimé',
        description: `L'utilisateur ${currentUser.fullName} a été supprimé avec succès.`,
      })
      setIsDeleteModalOpen(false)
      setConfirmationString('')
      setUserConfirmationInput('')
      refetch()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue: ${error.message}`,
        variant: 'destructive'
      })
    }
  }

  const openEditModal = (user: User) => {
    setCurrentUser(user)
    setIsModalOpen(true)
  }

  const openDeleteModal = (user: User) => {
    // Vérifier si l'utilisateur actuel est un admin et essaie de supprimer un autre admin
    if (userProfile?.role === 'admin' && user.role === 'admin' && userProfile.$id !== user.$id) {
      toast({
        title: 'Action interdite',
        description: 'Un administrateur ne peut pas supprimer un autre administrateur.',
        variant: 'destructive'
      })
      return
    }
    
    setCurrentUser(user)
    setConfirmationString(generateRandomString(5))
    setUserConfirmationInput('')
    setIsDeleteModalOpen(true)
  }

  // Fonction pour obtenir le nom de la boutique à partir de son ID
  const getStoreName = (storeId: string) => {
    const store = stores?.find(s => s.$id === storeId)
    return store ? store.name : 'Boutique inconnue'
  }

  // Fonction pour obtenir les statistiques d'un utilisateur
  const getUserStats = (userId: string) => {
    const stats = sellerStats.find(s => s.userId === userId)
    return stats || { totalRevenue: 0, salesCount: 0 }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-secondary">Gestion des Utilisateurs</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* Sections des tops vendeurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 des meilleurs vendeurs */}
        <div className="bg-white shadow-sm ring-1 ring-primary/5 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-600 mb-4">🏆 Top 3 des meilleurs vendeurs</h2>
          {statsLoading ? (
            <div className="text-center text-sm text-gray-500">Chargement...</div>
          ) : topSellers.length > 0 ? (
            <div className="space-y-3">
              {/* Premier vendeur - ligne complète */}
              {topSellers[0] && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-green-600">#1</span>
                    <div>
                      <p className="font-medium text-gray-900">{topSellers[0].fullName}</p>
                      <p className="text-sm text-gray-500">{topSellers[0].email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(topSellers[0].totalRevenue)}</p>
                    <p className="text-sm text-gray-500">{topSellers[0].salesCount} ventes</p>
                  </div>
                </div>
              )}
              
              {/* Deuxième et troisième vendeurs - ligne divisée en deux colonnes */}
              {(topSellers[1] || topSellers[2]) && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Deuxième vendeur */}
                  {topSellers[1] && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-green-600">#2</span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{topSellers[1].fullName}</p>
                          <p className="text-xs text-gray-500">{topSellers[1].email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 text-sm">{formatCurrency(topSellers[1].totalRevenue)}</p>
                        <p className="text-xs text-gray-500">{topSellers[1].salesCount} ventes</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Troisième vendeur */}
                  {topSellers[2] && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-green-600">#3</span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{topSellers[2].fullName}</p>
                          <p className="text-xs text-gray-500">{topSellers[2].email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 text-sm">{formatCurrency(topSellers[2].totalRevenue)}</p>
                        <p className="text-xs text-gray-500">{topSellers[2].salesCount} ventes</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500">Aucune donnée disponible</div>
          )}
        </div>

        {/* Top 3 des vendeurs à risque */}
        <div className="bg-white shadow-sm ring-1 ring-primary/5 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-4">⚠️ Top 3 des vendeurs à risque</h2>
          {statsLoading ? (
            <div className="text-center text-sm text-gray-500">Chargement...</div>
          ) : riskSellers.length > 0 ? (
            <div className="space-y-3">
              {riskSellers.map((seller, index) => (
                <div key={seller.userId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-red-600">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{seller.fullName}</p>
                      <p className="text-sm text-gray-500">{seller.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{formatCurrency(seller.totalRevenue)}</p>
                    <p className="text-sm text-gray-500">{seller.salesCount} ventes</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500">Aucune donnée disponible</div>
          )}
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white shadow-sm ring-1 ring-primary/5 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom complet
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chiffre d'affaires
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre de ventes
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading || statsLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : users && users.length > 0 ? (
              users.map((user) => {
                const stats = getUserStats(user.$id)
                return (
                  <tr key={user.$id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role === 'admin' ? 'Administrateur' : 
                       user.role === 'manager' ? 'Manager' : 'Vendeur'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role === 'seller' ? formatCurrency(stats.totalRevenue) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {user.role === 'seller' ? stats.salesCount.toString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-primary hover:text-primary/80 mr-4"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal pour ajouter/modifier un utilisateur */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {currentUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Nom complet
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Rôle
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="admin">Administrateur</option>
                  <option value="manager">Manager</option>
                  <option value="seller">Vendeur</option>
                </select>
              </div>
              <div>
                <label htmlFor="storeId" className="block text-sm font-medium text-gray-700">
                  Boutique
                </label>
                <select
                  id="storeId"
                  name="storeId"
                  value={formData.storeId}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="">Sélectionner une boutique</option>
                  {stores?.map(store => (
                    <option key={store.$id} value={store.$id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
                >
                  {currentUser ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirmer la suppression</h2>
            <p className="mb-4">
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{currentUser?.fullName}</strong> ? Cette action est irréversible.
            </p>
            
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800 mb-2">
                Pour confirmer la suppression, veuillez saisir exactement la chaîne suivante :
              </p>
              <div className="bg-gray-100 p-2 rounded font-mono text-lg text-center mb-3">
                {confirmationString}
              </div>
              <input
                type="text"
                value={userConfirmationInput}
                onChange={(e) => setUserConfirmationInput(e.target.value)}
                placeholder="Saisissez la chaîne de confirmation"
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setConfirmationString('')
                  setUserConfirmationInput('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={userConfirmationInput !== confirmationString}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}