import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { FiX, FiUser, FiShoppingBag, FiHeart, FiStar, FiEdit3, FiTrash2, FiGift } from 'react-icons/fi'
import { Client } from '@/types/client.types'
import { AppwriteDocument } from '@/types/appwrite.types'
import { useUpdateCachedClient, useDeleteCachedClient } from '@/hooks/useCachedClients'
import { useGroupedNotifications } from '@/hooks/useGroupedNotifications'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { formatCurrency } from '@/lib/utils/formatters'
import LoyaltyTab from './LoyaltyTab'
import HistoryTab from './HistoryTab'

interface ClientDetailModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client | null
}

export default function ClientDetailModal({ isOpen, onClose, client }: ClientDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedClient, setEditedClient] = useState<Partial<Client>>({})
  const { mutate: updateClient, isPending: isUpdating } = useUpdateCachedClient()
  const { mutate: deleteClient, isPending: isDeleting } = useDeleteCachedClient()
  const { showGroupedNotification } = useGroupedNotifications()
  const handleError = useErrorHandler()
  const [activeTab, setActiveTab] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (client) {
      setEditedClient({
        fullName: client.fullName,
        email: client.email,
        phone: client.phone,
        address: client.address,
        gender: client.gender,
        segment: client.segment,
        vipStatus: client.vipStatus,
        preferredStore: client.preferredStore,
        preferredCategories: client.preferredCategories,
        tags: client.tags,
      })
    }
  }, [client])

  const handleSave = () => {
    if (!client) return

    updateClient(
      { id: client.$id, updates: editedClient },
      {
        onSuccess: () => {
          showGroupedNotification('success', `Les informations de ${client.fullName} ont été mises à jour avec succès.`, 'client-update')
          setIsEditing(false)
        },
        onError: (error) => {
          handleError(error, `Une erreur est survenue lors de la mise à jour des informations de ${client.fullName}.`)
        }
      }
    )
  }

  const handleDelete = () => {
    if (!client) return

    deleteClient(
      client.$id,
      {
        onSuccess: () => {
          showGroupedNotification('success', `Le client ${client.fullName} a été supprimé avec succès.`, 'client-delete')
          setConfirmDelete(false)
          onClose()
        },
        onError: (error) => {
          handleError(error, `Une erreur est survenue lors de la suppression de ${client.fullName}.`)
          setConfirmDelete(false)
        }
      }
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'vipStatus') {
      setEditedClient((prev) => ({ ...prev, vipStatus: (e.target as HTMLInputElement).checked }))
    } else {
      setEditedClient((prev) => ({ ...prev, [name]: value }))
    }
  }

  if (!client) return null

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'premium': return 'bg-purple-100 text-purple-800'
      case 'gold': return 'bg-yellow-100 text-yellow-800'
      case 'silver': return 'bg-gray-100 text-gray-800'
      case 'bronze': return 'bg-amber-100 text-amber-800'
      default: return 'bg-gray-100 text-gray-500'
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {
        if (!isEditing && !isUpdating && !isDeleting) onClose()
      }}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <FiUser className="mr-2" />
                    {client.fullName}
                    {client.vipStatus && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <FiStar className="mr-1" /> VIP
                      </span>
                    )}
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSegmentColor(client.segment)}`}>
                      {client.segment.charAt(0).toUpperCase() + client.segment.slice(1)}
                    </span>
                  </Dialog.Title>
                  <div className="flex space-x-2">
                    {!isEditing ? (
                      <>
                        <button
                          type="button"
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-blue-600 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          onClick={() => setIsEditing(true)}
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                          onClick={() => setConfirmDelete(true)}
                        >
                          <FiTrash2 />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          onClick={handleSave}
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          onClick={() => {
                            setIsEditing(false)
                            setEditedClient({
                              fullName: client.fullName,
                              email: client.email,
                              phone: client.phone,
                              address: client.address,
                              gender: client.gender,
                              segment: client.segment,
                              vipStatus: client.vipStatus,
                              preferredStore: client.preferredStore,
                              preferredCategories: client.preferredCategories,
                              tags: client.tags,
                            })
                          }}
                          disabled={isUpdating}
                        >
                          Annuler
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center p-2 border border-transparent rounded-full text-gray-400 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={onClose}
                      disabled={isEditing || isUpdating || isDeleting}
                    >
                      <FiX />
                    </button>
                  </div>
                </div>

                {/* Navigation des onglets avec des éléments HTML standard */}
                <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-4">
                  <button
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
                    ${activeTab === 0
                      ? 'bg-white shadow text-blue-700'
                      : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-600'}`}
                    onClick={() => setActiveTab(0)}
                  >
                    <FiUser className="mr-2" /> Aperçu
                  </button>
                  <button
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
                    ${activeTab === 1
                      ? 'bg-white shadow text-blue-700'
                      : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-600'}`}
                    onClick={() => setActiveTab(1)}
                  >
                    <FiShoppingBag className="mr-2" /> Historique
                  </button>
                  <button
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
                    ${activeTab === 2
                      ? 'bg-white shadow text-blue-700'
                      : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-600'}`}
                    onClick={() => setActiveTab(2)}
                  >
                    <FiGift className="mr-2" /> Fidélité
                  </button>

                </div>

                {/* Contenu des onglets avec rendu conditionnel */}
                {activeTab === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-4">Informations personnelles</h4>
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nom complet</label>
                            <input
                              type="text"
                              name="fullName"
                              id="fullName"
                              value={editedClient.fullName || ''}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              value={editedClient.email || ''}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                            <input
                              type="text"
                              name="phone"
                              id="phone"
                              value={editedClient.phone || ''}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Adresse</label>
                            <textarea
                              name="address"
                              id="address"
                              value={editedClient.address || ''}
                              onChange={handleChange}
                              rows={3}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Genre</label>
                            <select
                              name="gender"
                              id="gender"
                              value={editedClient.gender || 'homme'}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="homme">Homme</option>
                              <option value="femme">Femme</option>
                              <option value="entreprise">Entreprise</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Nom complet</dt>
                            <dd className="mt-1 text-sm text-gray-900">{client.fullName}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="mt-1 text-sm text-gray-900">{client.email}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                            <dd className="mt-1 text-sm text-gray-900">{client.phone}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Genre</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {client.gender === 'homme' ? 'Homme' : 
                               client.gender === 'femme' ? 'Femme' : 'Entreprise'}
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                            <dd className="mt-1 text-sm text-gray-900">{client.address}</dd>
                          </div>
                        </dl>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-4">Informations commerciales</h4>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Points de fidélité</dt>
                          <dd className="mt-1 text-sm text-gray-900">{client.loyaltyPoints}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Total dépensé</dt>
                          <dd className="mt-1 text-sm text-gray-900">{Math.round(client.totalSpent)} FCFA</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Segment</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              client.loyaltyStatus === 'or' ? 'bg-yellow-100 text-yellow-800' :
                              client.loyaltyStatus === 'argent' ? 'bg-gray-100 text-gray-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {client.loyaltyStatus === 'or' ? 'Or' :
                               client.loyaltyStatus === 'argent' ? 'Argent' : 'Bronze'}
                            </span>
                          </dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Date de création</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {client.$createdAt ? new Date(client.$createdAt).toLocaleDateString() : 'Non disponible'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                )}

                {/* Onglet Historique */}
                {activeTab === 1 && (
                  <HistoryTab client={client} />
                )}
                
                {/* Onglet Fidélité */}
                {activeTab === 2 && (
                  <LoyaltyTab client={client} />
                )}
                


                {/* Modal de confirmation de suppression */}
                {confirmDelete && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmer la suppression</h3>
                      <p className="text-gray-500 mb-6">Êtes-vous sûr de vouloir supprimer définitivement {client.fullName} ? Cette action est irréversible.</p>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                          onClick={() => setConfirmDelete(false)}
                          disabled={isDeleting}
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Suppression...' : 'Supprimer'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
