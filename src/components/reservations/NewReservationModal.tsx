'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { FiX, FiSearch, FiCalendar, FiDollarSign } from 'react-icons/fi'
import { useAllClients } from '@/hooks/useClients'
import { useCreateCachedReservation } from '@/hooks/useCachedReservations'
import { formatCurrency } from '@/lib/utils/formatters'
import { Client } from '@/types/client.types'
import { Product } from '@/types/product.types'
import { ReservationFormData, ReservationItemInput } from '@/types/reservation.types'
import { useProducts } from '@/hooks/useProducts'
import { useStores } from '@/hooks/useStores'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface NewReservationModalProps {
  open: boolean
  onClose: () => void
}

export default function NewReservationModal({ open, onClose }: NewReservationModalProps) {
  const { data: clients, isLoading: isLoadingClients } = useAllClients()
  const { data: products, isLoading: isLoadingProducts } = useProducts()
  const { data: stores } = useStores()
  const createReservation = useCreateCachedReservation()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedStore, setSelectedStore] = useState('')
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([])  
  const [pickupDate, setPickupDate] = useState<Date | null>(null)
  const [depositAmount, setDepositAmount] = useState<number | ''>('')
  const [depositPaid, setDepositPaid] = useState(false)
  const [notes, setNotes] = useState('')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [isClientSearchFocused, setIsClientSearchFocused] = useState(false)

  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].$id)
    }
  }, [stores, selectedStore])

  const filteredClients = clients?.filter(client => {
    if (!searchTerm.trim()) return true; // Montrer tous les clients si le champ est vide
    
    const fullName = client.fullName.toLowerCase()
    const phone = client.phone?.toLowerCase() || ''
    const email = client.email?.toLowerCase() || ''
    const term = searchTerm.toLowerCase()
    
    return fullName.includes(term) || phone.includes(term) || email.includes(term)
  }) || []

  const filteredProducts = products?.filter(product => {
    const name = product.name.toLowerCase()
    const term = productSearchTerm.toLowerCase()
    
    return name.includes(term)
  }) || []

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client)
    setSearchTerm('')
  }

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.$id === product.$id)
      
      if (existingItem) {
        return prevCart.map(item => 
          item.product.$id === product.$id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      } else {
        return [...prevCart, { product, quantity: 1 }]
      }
    })
    setProductSearchTerm('')
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.product.$id !== productId))
    } else {
      setCart(prevCart => 
        prevCart.map(item => 
          item.product.$id === productId 
            ? { ...item, quantity } 
            : item
        )
      )
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.$id !== productId))
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const handleSubmit = async () => {
    if (!selectedClient || !selectedStore || cart.length === 0 || !pickupDate) return

    const reservationItems: ReservationItemInput[] = cart.map(item => ({
      productId: item.product.$id,
      quantity: item.quantity,
      unitPrice: item.product.price,
      // Pas de totalPrice dans ReservationItemInput
      // Le total sera calculé côté serveur
    }))

    const reservationData: ReservationFormData = {
      clientId: selectedClient.$id,
      storeId: selectedStore,
      expectedPickupDate: pickupDate.toISOString().split('T')[0], // Format YYYY-MM-DD
      depositAmount: depositAmount === '' ? 0 : depositAmount,
      depositPaid,
      notes,
      // status est ajouté dans createParams, pas dans ReservationFormData
      items: reservationItems
    }

    try {
      // Adapter les données au format attendu par CreateReservationParams
      const createParams = {
        reservation: {
          clientId: selectedClient?.$id || '',
          storeId: selectedStore,
          expectedPickupDate: reservationData.expectedPickupDate,
          depositAmount: reservationData.depositAmount,
          depositPaid: reservationData.depositPaid,
          notes: reservationData.notes,
          status: 'active' as const, // Utiliser un type littéral pour status
          createdBy: 'current-user-id' // À remplacer par l'ID de l'utilisateur actuel
        },
        items: reservationData.items
      }
      
      await createReservation.mutateAsync(createParams)
      resetForm()
      onClose()
    } catch (error: unknown) {
      console.error('Error creating reservation:', error)
    }
  }

  const resetForm = () => {
    setSelectedClient(null)
    setSelectedStore(stores && stores.length > 0 ? stores[0].$id : '')
    setCart([])
    setPickupDate(null)
    setDepositAmount('')
    setDepositPaid(false)
    setNotes('')
    setProductSearchTerm('')
    setSearchTerm('')
  }

  // Utilisation de la fonction formatCurrency importée

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fermer</span>
                    <FiX className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                      Nouvelle Réservation
                    </Dialog.Title>
                    <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                      {/* Sélection du client */}
                      <div className="sm:col-span-3">
                        <label htmlFor="client" className="block text-sm font-medium leading-6 text-gray-900">
                          Client
                        </label>
                        <div className="mt-2">
                          {selectedClient ? (
                            <div className="flex items-center justify-between rounded-md border border-gray-300 px-3 py-2">
                              <div>
                                <p className="font-medium">{selectedClient.fullName}</p>
                                <p className="text-sm text-gray-500">{selectedClient.phone}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedClient(null)}
                                className="text-gray-400 hover:text-gray-500"
                              >
                                <FiX className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <FiSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
                              </div>
                              <input
                                type="text"
                                name="client-search"
                                id="client-search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsClientSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsClientSearchFocused(false), 200)}
                                className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                placeholder="Rechercher un client..."
                              />
                              {isClientSearchFocused && (
                                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                  {isLoadingClients ? (
                                    <div className="px-4 py-2 text-gray-500">Chargement...</div>
                                  ) : filteredClients.length > 0 ? (
                                    filteredClients.map((client) => (
                                      <div
                                        key={client.$id}
                                        onClick={() => handleSelectClient(client)}
                                        className="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-100"
                                      >
                                        <div className="flex items-center">
                                          <span className="font-medium">{client.fullName}</span>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-500">
                                          {client.phone}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-4 py-2 text-gray-500">Aucun client trouvé</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sélection du magasin */}
                      <div className="sm:col-span-3">
                        <label htmlFor="store" className="block text-sm font-medium leading-6 text-gray-900">
                          Magasin
                        </label>
                        <div className="mt-2">
                          <select
                            id="store"
                            name="store"
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                          >
                            {stores?.map((store) => (
                              <option key={store.$id} value={store.$id}>
                                {store.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Date de retrait */}
                      <div className="sm:col-span-3">
                        <label htmlFor="pickup-date" className="block text-sm font-medium leading-6 text-gray-900">
                          Date de retrait prévue
                        </label>
                        <div className="mt-2 relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <FiCalendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </div>
                          <DatePicker
                            selected={pickupDate}
                            onChange={(date: Date | null) => setPickupDate(date)}
                            dateFormat="dd/MM/yyyy"
                            minDate={new Date()}
                            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                            placeholderText="Sélectionner une date"
                          />
                        </div>
                      </div>

                      {/* Acompte */}
                      <div className="sm:col-span-3">
                        <label htmlFor="deposit" className="block text-sm font-medium leading-6 text-gray-900">
                          Acompte
                        </label>
                        <div className="mt-2 relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <FiDollarSign className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </div>
                          <input
                            type="number"
                            name="deposit"
                            id="deposit"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value === '' ? '' : Number(e.target.value))}
                            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                            placeholder="Montant de l'acompte"
                          />
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center">
                            <input
                              id="deposit-paid"
                              name="deposit-paid"
                              type="checkbox"
                              checked={depositPaid}
                              onChange={(e) => setDepositPaid(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="deposit-paid" className="ml-2 block text-sm text-gray-900">
                              Acompte payé
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="sm:col-span-6">
                        <label htmlFor="notes" className="block text-sm font-medium leading-6 text-gray-900">
                          Notes
                        </label>
                        <div className="mt-2">
                          <textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                            placeholder="Informations supplémentaires..."
                          />
                        </div>
                      </div>

                      {/* Recherche de produits */}
                      <div className="sm:col-span-6">
                        <label htmlFor="product-search" className="block text-sm font-medium leading-6 text-gray-900">
                          Ajouter des produits
                        </label>
                        <div className="mt-2 relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <FiSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </div>
                          <input
                            type="text"
                            name="product-search"
                            id="product-search"
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                            placeholder="Rechercher un produit..."
                          />
                          {productSearchTerm && (
                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {isLoadingProducts ? (
                                <div className="px-4 py-2 text-gray-500">Chargement...</div>
                              ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                  <div
                                    key={product.$id}
                                    onClick={() => addToCart(product)}
                                    className="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-100"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{product.name}</span>
                                      <span className="text-gray-900">{formatCurrency(product.price)}</span>
                                    </div>
                                    <div className="mt-1 text-sm text-gray-500">
                                      {product.description}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-gray-500">Aucun produit trouvé</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Panier */}
                      {cart.length > 0 && (
                        <div className="sm:col-span-6">
                          <div className="rounded-md border border-gray-200">
                            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                              <h4 className="text-sm font-medium text-gray-900">Produits réservés</h4>
                            </div>
                            <ul className="divide-y divide-gray-200">
                              {cart.map((item) => (
                                <li key={item.product.$id} className="flex items-center justify-between px-4 py-3">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="font-medium text-gray-900">{item.product.name}</p>
                                      <div className="ml-4 flex items-center space-x-2">
                                        <button
                                          type="button"
                                          onClick={() => updateQuantity(item.product.$id, item.quantity - 1)}
                                          className="rounded-md bg-white p-1 text-gray-400 hover:text-gray-500"
                                        >
                                          <span className="sr-only">Diminuer</span>
                                          <span className="text-lg font-medium">-</span>
                                        </button>
                                        <span className="text-gray-900">{item.quantity}</span>
                                        <button
                                          type="button"
                                          onClick={() => updateQuantity(item.product.$id, item.quantity + 1)}
                                          className="rounded-md bg-white p-1 text-gray-400 hover:text-gray-500"
                                        >
                                          <span className="sr-only">Augmenter</span>
                                          <span className="text-lg font-medium">+</span>
                                        </button>
                                      </div>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between text-sm">
                                      <p className="text-gray-500">{formatCurrency(item.product.price)} / unité</p>
                                      <p className="font-medium text-gray-900">{formatCurrency(item.product.price * item.quantity)}</p>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(item.product.$id)}
                                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                    >
                                      <span className="sr-only">Supprimer</span>
                                      <FiX className="h-5 w-5" />
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                            <div className="border-t border-gray-200 px-4 py-3">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">Total</p>
                                <p className="text-lg font-medium text-gray-900">{formatCurrency(calculateTotal())}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-8 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 sm:ml-3 sm:w-auto disabled:bg-gray-300 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={!selectedClient || !selectedStore || cart.length === 0 || !pickupDate || createReservation.isPending}
                  >
                    {createReservation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Annuler
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}