'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { useClients } from '@/hooks/useClients'
import { useCreateSale } from '@/hooks/useSales'
import { useStores } from '@/hooks/useStores'
import { useAuth } from '@/providers/AuthProvider'
import { formatCurrency } from '@/lib/utils/formatters'
import { Client, Product } from '@/types/appwrite.types'
import ProductSelector from './ProductSelector'
import { useRouter } from 'next/navigation'

type UnifiedSaleModalProps = {
  isOpen: boolean
  onClose: () => void
  storeId: string
  storeName: string
  isCredit?: boolean // Nouvelle prop pour différencier les types de ventes
}

type CartItem = {
  product: Product
  quantity: number
}

type PaymentMethodType = 'especes' | 'carte' | 'wave' | 'orange_money' | 'cheque' | 'cheque_cadeau' | 'virement'

type PaymentSplit = {
  method: PaymentMethodType
  amount: number
}

export default function UnifiedSaleModal({ isOpen, onClose, storeId, storeName, isCredit = false }: UnifiedSaleModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed')
  const [discountValue, setDiscountValue] = useState(0)
  const [payments, setPayments] = useState<PaymentSplit[]>([])
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethodType>('especes')
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState(0)
  const [selectedStore, setSelectedStore] = useState<string>(storeId || '')
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0])
  
  // Champs spécifiques aux ventes à crédit
  const [numberOfInstallments, setNumberOfInstallments] = useState(1)

  const { data: clients, isLoading: isLoadingClients } = useClients(searchQuery)
  const { data: stores } = useStores()
  const { user } = useAuth()
  const router = useRouter()
  const createSale = useCreateSale()
  const [isFormValid, setIsFormValid] = useState(false)
  
  // Fonction pour naviguer vers la page d'ajout de client
  const handleAddNewClient = () => {
    onClose()
    router.push('/clients?newClient=true')
  }

  // Calcul du sous-total (avant remise)
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  
  // Calcul de la remise
  useEffect(() => {
    if (discountType === 'percentage') {
      setDiscountAmount((subtotal * discountValue) / 100)
    } else {
      setDiscountAmount(discountValue)
    }
  }, [discountType, discountValue, subtotal])
  
  // Calcul du total (après remise)
  const total = Math.max(0, subtotal - discountAmount)
  
  // Calcul du total des paiements
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  
  // Montant restant à payer
  const remainingAmount = Math.max(0, total - totalPayments)

  // Fonction pour ajouter un paiement
  const handleAddPayment = () => {
    if (currentPaymentAmount <= 0 || currentPaymentAmount > remainingAmount) return
    
    setPayments([...payments, {
      method: currentPaymentMethod,
      amount: currentPaymentAmount
    }])
    
    setCurrentPaymentAmount(0)
  }
  
  // Fonction pour supprimer un paiement
  const handleRemovePayment = (index: number) => {
    const newPayments = [...payments]
    newPayments.splice(index, 1)
    setPayments(newPayments)
  }

  const handleSubmit = async () => {
    if (!selectedClient || !selectedStore || !user || cart.length === 0) return
    
    // Pour les ventes normales, vérifier que le montant total est payé
    // Pour les ventes à crédit, permettre un paiement partiel ou nul
    if (!isCredit && totalPayments < total) {
      alert('Le montant total doit être payé avant de finaliser la vente')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Déterminer la méthode de paiement principale
      let mainPaymentMethod: PaymentMethodType = 'especes'
      if (payments.length > 0) {
        const paymentsByAmount = [...payments].sort((a, b) => b.amount - a.amount)
        mainPaymentMethod = paymentsByAmount[0].method
      }

      // Créer l'objet de vente unifié
      const saleData: any = {
        clientId: selectedClient.$id,
        storeId: selectedStore,
        userId: user.$id,
        user_seller: user.$id, // Utiliser user_seller comme standardisé
        totalAmount: total,
        discountAmount: discountAmount,
        paymentMethod: mainPaymentMethod,
        status: (!isCredit && totalPayments >= total) || (isCredit && totalPayments >= total) ? 'completed' : 'pending',
        saleDate: new Date(saleDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString(),
        isCredit: isCredit, // Nouveau champ pour différencier les types
      }
      
      // Ajouter les champs spécifiques aux ventes à crédit si nécessaire
      if (isCredit) {
        saleData.paidAmount = totalPayments
        saleData.initialPayment = totalPayments
        saleData.remainingAmount = total - totalPayments
        saleData.numberOfInstallments = numberOfInstallments
      }
      
      // Ajouter les montants de paiement par méthode
      const paymentMethods = ['especes', 'carte', 'wave', 'orange_money', 'cheque', 'cheque_cadeau', 'virement']
      paymentMethods.forEach(method => {
        saleData[`payment_${method}`] = "0"
      })
      
      // Mettre à jour avec les montants réels
      payments.forEach(payment => {
        saleData[`payment_${payment.method}`] = payment.amount.toString()
      })
      
      await createSale.mutateAsync({
        sale: saleData,
        items: cart.map((item) => ({
          productId: item.product.$id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          discountAmount: 0,
        })),
      })

      // Réinitialiser le formulaire
      setCart([])
      setSelectedClient(null)
      setDiscountAmount(0)
      setDiscountValue(0)
      setPayments([])
      setCurrentPaymentAmount(0)
      setNumberOfInstallments(1)
      onClose()
    } catch (error) {
      console.error('Error creating sale:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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

        <div className="fixed inset-0 z-50 overflow-y-auto">
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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                      {isCredit ? 'Nouvelle vente à crédit' : 'Nouvelle vente'} - {storeName}
                    </Dialog.Title>
                    
                    {/* Formulaire de vente unifié */}
                    <div className="space-y-6">
                      {/* Section 1: Sélection du client */}
                      <div className="border-b border-gray-200 pb-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Client</h4>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Rechercher un client..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {searchQuery && clients && clients.length > 0 && (
                              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                {clients.map((client) => (
                                  <div
                                    key={client.$id}
                                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
                                    onClick={() => {
                                      setSelectedClient(client)
                                      setSearchQuery('')
                                    }}
                                  >
                                    <div className="flex items-center">
                                      <span className="font-normal ml-3 block truncate">
                                        {client.fullName} - {client.phone}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleAddNewClient}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <UserPlusIcon className="h-4 w-4 mr-1" />
                            Nouveau
                          </button>
                        </div>
                        {selectedClient && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <div className="text-sm font-medium text-gray-900">{selectedClient.fullName}</div>
                            <div className="text-sm text-gray-500">{selectedClient.phone}</div>
                            <div className="text-sm text-gray-500">
                              Genre: {selectedClient.gender === 'homme' ? 'Homme' : selectedClient.gender === 'femme' ? 'Femme' : 'Entreprise'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Section 2: Sélection des produits */}
                      <div className="border-b border-gray-200 pb-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Produits</h4>
                        <ProductSelector
                           selectedProducts={cart}
                           onProductsChange={(products) => {
                             setCart(products)
                           }}
                         />
                      </div>



                      {/* Section 3: Remise */}
                      <div className="border-b border-gray-200 pb-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Remise</h4>
                        <div className="flex gap-4">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="fixed"
                              name="discountType"
                              value="fixed"
                              checked={discountType === 'fixed'}
                              onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                              className="mr-2"
                            />
                            <label htmlFor="fixed">Montant fixe</label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="percentage"
                              name="discountType"
                              value="percentage"
                              checked={discountType === 'percentage'}
                              onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                              className="mr-2"
                            />
                            <label htmlFor="percentage">Pourcentage</label>
                          </div>
                        </div>
                        <div className="mt-2">
                          <input
                            type="number"
                            min="0"
                            max={discountType === 'percentage' ? 100 : subtotal}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                            placeholder={discountType === 'percentage' ? 'Pourcentage' : 'Montant'}
                            className="w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-sm text-gray-500">
                            {discountType === 'percentage' ? '%' : 'FCFA'}
                          </span>
                        </div>
                      </div>
                    
                      {/* Section 4: Paiement */}
                      <div className="border-b border-gray-200 pb-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Paiements</h4>
                        <div className="flex gap-2 mb-3">
                          <select
                            value={currentPaymentMethod}
                            onChange={(e) => setCurrentPaymentMethod(e.target.value as PaymentMethodType)}
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="especes">Espèces</option>
                            <option value="carte">Carte</option>
                            <option value="wave">Wave</option>
                            <option value="orange_money">Orange Money</option>
                            <option value="cheque">Chèque</option>
                            <option value="cheque_cadeau">Chèque cadeau</option>
                            <option value="virement">Virement</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            max={remainingAmount}
                            value={currentPaymentAmount}
                            onChange={(e) => setCurrentPaymentAmount(parseFloat(e.target.value) || 0)}
                            placeholder="Montant"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddPayment}
                            disabled={currentPaymentAmount <= 0 || currentPaymentAmount > remainingAmount}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300"
                          >
                            Ajouter
                          </button>
                        </div>
                        {payments.length > 0 && (
                          <div className="space-y-1">
                            {payments.map((payment, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="capitalize">{payment.method.replace('_', ' ')}</span>
                                <div className="flex items-center gap-2">
                                  <span>{formatCurrency(payment.amount)}</span>
                                  <button
                                    onClick={() => handleRemovePayment(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section 5: Champs spécifiques aux ventes à crédit */}
                      {isCredit && (
                        <div className="border-b border-gray-200 pb-4">
                          <h4 className="text-md font-medium text-gray-900 mb-3">Informations de crédit</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre d'échéances
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="12"
                                value={numberOfInstallments}
                                onChange={(e) => setNumberOfInstallments(parseInt(e.target.value) || 1)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section 6: Récapitulatif */}
                      {cart.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h4 className="text-md font-medium text-gray-900 mb-3">Récapitulatif</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Sous-total:</span>
                              <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                              <div className="flex justify-between text-red-600">
                                <span>Remise:</span>
                                <span>-{formatCurrency(discountAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold text-lg border-t pt-2">
                              <span>Total:</span>
                              <span>{formatCurrency(total)}</span>
                            </div>
                            {totalPayments > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Payé:</span>
                                <span>{formatCurrency(totalPayments)}</span>
                              </div>
                            )}
                            {remainingAmount > 0 && (
                              <div className="flex justify-between text-orange-600">
                                <span>Restant:</span>
                                <span>{formatCurrency(remainingAmount)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                        onClick={handleSubmit}
                        disabled={isSubmitting || cart.length === 0 || !selectedClient || (!isCredit && totalPayments < total)}
                      >
                        {isSubmitting ? 'Création...' : (isCredit ? 'Créer la vente à crédit' : 'Créer la vente')}
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onClick={onClose}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}