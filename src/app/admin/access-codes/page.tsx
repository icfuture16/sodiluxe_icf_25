'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/client'
import { ID, Query } from 'appwrite'
import { useToast } from '@/components/ui/use-toast'

interface AccessCode {
  $id: string
  $createdAt: string
  $updatedAt: string
  code: string
  isUsed: boolean
  usedBy?: string
  usedAt?: string
  expiresAt?: string
}

interface AccessCodeFormData {
  code: string
  expiresAt?: string
}

export default function AccessCodesAdminPage() {
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentAccessCode, setCurrentAccessCode] = useState<AccessCode | null>(null)
  const [formData, setFormData] = useState<AccessCodeFormData>({
    code: '',
    expiresAt: ''
  })
  const { toast } = useToast()

  // Charger les codes d'accès
  const fetchAccessCodes = async () => {
    setIsLoading(true)
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ACCESS_CODES,
        [Query.orderDesc('$createdAt')]
      )
      // Conversion explicite de Document[] en AccessCode[] avec un cast approprié
      setAccessCodes(response.documents as unknown as AccessCode[])
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de charger les codes d'accès: ${error.message}`,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAccessCodes()
  }, [])

  // Réinitialiser le formulaire lorsque le modal est ouvert/fermé
  useEffect(() => {
    if (!isModalOpen) {
      setFormData({ code: '', expiresAt: '' })
      setCurrentAccessCode(null)
    }
  }, [isModalOpen])

  // Remplir le formulaire avec les données du code d'accès à éditer
  useEffect(() => {
    if (currentAccessCode) {
      setFormData({
        code: currentAccessCode.code,
        expiresAt: currentAccessCode.expiresAt || ''
      })
    }
  }, [currentAccessCode])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (currentAccessCode) {
        // Mise à jour d'un code d'accès existant
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.ACCESS_CODES,
          currentAccessCode.$id,
          {
            code: formData.code,
            expiresAt: formData.expiresAt || null
          }
        )
        toast({
          title: 'Code d\'accès mis à jour',
          description: `Le code d'accès a été mis à jour avec succès.`,
        })
      } else {
        // Création d'un nouveau code d'accès
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.ACCESS_CODES,
          ID.unique(),
          {
            code: formData.code,
            isUsed: false,
            expiresAt: formData.expiresAt || null
          }
        )
        toast({
          title: 'Code d\'accès créé',
          description: `Le code d'accès a été créé avec succès.`,
        })
      }
      
      // Fermer le modal et rafraîchir la liste
      setIsModalOpen(false)
      fetchAccessCodes()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue: ${error.message}`,
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!currentAccessCode) return
    
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.ACCESS_CODES,
        currentAccessCode.$id
      )
      toast({
        title: 'Code d\'accès supprimé',
        description: `Le code d'accès a été supprimé avec succès.`,
      })
      setIsDeleteModalOpen(false)
      fetchAccessCodes()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue: ${error.message}`,
        variant: 'destructive'
      })
    }
  }

  const openEditModal = (accessCode: AccessCode) => {
    setCurrentAccessCode(accessCode)
    setIsModalOpen(true)
  }

  const openDeleteModal = (accessCode: AccessCode) => {
    setCurrentAccessCode(accessCode)
    setIsDeleteModalOpen(true)
  }

  // Générer un code d'accès aléatoire
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    setFormData(prev => ({ ...prev, code: result }))
  }

  // Formater la date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-secondary">Gestion des Codes d'Accès</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Ajouter un code d'accès
        </button>
      </div>

      {/* Liste des codes d'accès */}
      <div className="bg-white shadow-sm ring-1 ring-primary/5 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisé par
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date d'utilisation
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date d'expiration
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
            ) : accessCodes.length > 0 ? (
              accessCodes.map((accessCode) => (
                <tr key={accessCode.$id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {accessCode.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${accessCode.isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {accessCode.isUsed ? 'Utilisé' : 'Disponible'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {accessCode.usedBy || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {accessCode.usedAt ? formatDate(accessCode.usedAt) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {accessCode.expiresAt ? formatDate(accessCode.expiresAt) : 'Pas d\'expiration'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!accessCode.isUsed && (
                      <>
                        <button
                          onClick={() => openEditModal(accessCode)}
                          className="text-primary hover:text-primary/80 mr-4"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(accessCode)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucun code d'accès trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal pour ajouter/modifier un code d'accès */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {currentAccessCode ? 'Modifier le code d\'accès' : 'Ajouter un code d\'accès'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Code d'accès
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    className="flex-1 block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100"
                  >
                    Générer
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">
                  Date d'expiration (optionnel)
                </label>
                <input
                  type="datetime-local"
                  id="expiresAt"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                />
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
                  {currentAccessCode ? 'Mettre à jour' : 'Ajouter'}
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
            <p className="mb-6">
              Êtes-vous sûr de vouloir supprimer ce code d'accès ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
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