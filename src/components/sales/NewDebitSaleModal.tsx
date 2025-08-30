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

type NewDebitSaleModalProps = {
  isOpen: boolean
  onClose: () => void
  storeId: string
  storeName: string
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

export default function NewDebitSaleModal({ isOpen, onClose, storeId, storeName }: NewDebitSaleModalProps) {
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

  const { data: clients, isLoading: isLoadingClients } = useClients(searchQuery)
  const { data: stores } = useStores()
  const { user } = useAuth();
  const router = useRouter();
  const createSale = useCreateSale();
  
  // Fonction pour naviguer vers la page d'ajout de client
  const handleAddNewClient = () => {
    // Fermer le modal actuel
    onClose();
    // Rediriger vers la page clients avec le modal d'ajout ouvert
    router.push('/clients?newClient=true');
  };

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
  
  // Montant restant à payer (pour les ventes débitrices, peut être > 0)
  const remainingAmount = Math.max(0, total - totalPayments)

  // Fonction pour ajouter un paiement
  const handleAddPayment = () => {
    if (currentPaymentAmount <= 0 || currentPaymentAmount > total) return
    
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
    
    // Pour les ventes débitrices, on accepte un paiement partiel ou nul
    // Le statut sera 'pending' si pas entièrement payé, 'completed' si entièrement payé
    const status = totalPayments >= total ? 'completed' : 'pending'

    try {
      setIsSubmitting(true)
      
      // Déterminer la méthode de paiement principale (celle avec le montant le plus élevé)
      let mainPaymentMethod: PaymentMethodType = 'especes'
      if (payments.length > 0) {
        const paymentsByAmount = [...payments].sort((a, b) => b.amount - a.amount)
        mainPaymentMethod = paymentsByAmount[0].method
      }

      // Créer l'objet de vente débitrice
      const saleData: any = {
        clientId: selectedClient.$id,
        storeId: selectedStore,
        userId: user.$id,
        totalAmount: total,
        discountAmount: discountAmount,
        paymentMethod: mainPaymentMethod,
        status: status, // 'pending' pour vente débitrice, 'completed' si entièrement payée
        saleDate: new Date(saleDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString(),
        isCredit: true, // Marquer comme vente à crédit
        paidAmount: totalPayments, // Définir le montant payé initial
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
          discountAmount: 0, // Pour l'instant, pas de remise par article
        })),
      })

      // Réinitialiser le formulaire
      setCart([])
      setSelectedClient(null)
      setDiscountAmount(0)
      setDiscountValue(0)
      setPayments([])
      setCurrentPaymentAmount(0)
      onClose()
    } catch (error) {
      console.error('Error creating debit sale:', error)
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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-secondary"
                    >
                      Nouvelle Vente Débitrice
                    </Dialog.Title>

                    {/* Informations automatiques - lecture seule */}
                     <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-orange-50 px-3 py-2 rounded-md border border-orange-200">
                       <div className="flex items-center gap-1">
                         <span className="font-medium">Date:</span>
                         <span className="text-gray-600">{new Date(saleDate).toLocaleDateString('fr-FR')}</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <span className="font-medium">Magasin:</span>
                         <span className="text-gray-600">{stores?.find(s => s.$id === selectedStore)?.name || 'Non défini'}</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <span className="font-medium">Vendeur:</span>
                         <span className="text-gray-600">{user?.name || 'Non défini'}</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <span className="font-medium text-orange-600">Type:</span>
                         <span className="text-orange-600 font-semibold">Vente à crédit</span>
                       </div>
                     </div>

                    <div className="mt-4 space-y-4">
                      
                      {/* Client selection */}
                      <div>
                        <label
                          htmlFor="client"
                          className="block text-sm font-medium text-secondary"
                        >
                          Client
                        </label>
                        <div className="mt-1 flex space-x-2">
                          <div className="flex-grow relative">
                            <input
                              type="text"
                              id="client"
                              className="block w-full rounded-md border-0 py-1.5 text-secondary shadow-sm ring-1 ring-inset ring-primary/10 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 pr-8"
                              placeholder="Rechercher un client..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                                onClick={() => setSearchQuery('')}
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleAddNewClient}
                            className="inline-flex items-center px-2.5 py-1.5 border border-primary text-xs font-medium rounded shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                          >
                            <UserPlusIcon className="h-4 w-4 mr-1" />
                            Nouveau client
                          </button>
                        </div>
                        {searchQuery.trim().length > 0 ? (
                          isLoadingClients ? (
                            <div className="mt-2 text-sm text-gray-500">
                              Chargement...
                            </div>
                          ) : (
                            <ul className="mt-2 max-h-40 overflow-auto rounded-md border border-gray-200 shadow-sm">
                              {clients && clients.length > 0 ? (
                                clients.map((client: Client) => (
                                  <li
                                    key={client.$id}
                                    className="cursor-pointer p-2 hover:bg-primary/5 border-b last:border-b-0"
                                    onClick={() => setSelectedClient(client)}
                                  >
                                    <div className="font-medium text-secondary">
                                      {client.fullName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {client.email}
                                    </div>
                                  </li>
                                ))
                              ) : (
                                <li className="p-2 text-sm text-gray-500">
                                  Aucun client trouvé
                                </li>
                              )}
                            </ul>
                          )
                        ) : null}
                      </div>

                      {/* Selected client */}
                      {selectedClient && (
                        <div className="rounded-md bg-primary/5 p-4">
                          <div className="font-medium text-secondary">
                            {selectedClient.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {selectedClient.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            Adresse: {selectedClient.address}
                          </div>
                          <div className="text-sm text-gray-500">
                            Genre: {selectedClient.gender === 'homme' ? 'Homme' : selectedClient.gender === 'femme' ? 'Femme' : 'Entreprise'}
                          </div>
                          {selectedClient.birthDate && (
                            <div className="text-sm text-gray-500">
                              Date de naissance: {new Date(selectedClient.birthDate).toLocaleDateString()}
                            </div>
                          )}
                          {selectedClient.loyaltyPoints > 0 && (
                            <div className="mt-1 text-sm text-primary">
                              Points de fidélité: {selectedClient.loyaltyPoints}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sélection de produits */}
                      <div>
                        <h4 className="font-medium text-secondary">Produits</h4>
                        <div className="mt-2">
                          <ProductSelector
                            selectedProducts={cart.map(item => ({ product: item.product, quantity: item.quantity }))}
                            onProductsChange={(products) => {
                              setCart(products.map(p => ({
                                product: p.product,
                                quantity: p.quantity
                              })))
                            }}
                          />
                        </div>
                      </div>

                      {/* Cart */}
                      {cart.length > 0 && (
                        <div>
                          <h4 className="font-medium text-secondary">Panier</h4>
                          <div className="mt-2">
                            {cart.map((item) => (
                              <div
                                key={item.product.$id}
                                className="flex items-center justify-between py-2"
                              >
                                <div>
                                  <div className="font-medium text-secondary">
                                    {item.product.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {formatCurrency(item.product.price)}
                                    {' x '}
                                    {item.quantity}
                                  </div>
                                </div>
                                <div className="font-medium text-secondary">
                                  {formatCurrency(item.product.price * item.quantity)}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Remise */}
                          <div className="mt-4 border-t border-primary/10 pt-4">
                            <h4 className="font-medium text-secondary">Remise</h4>
                            <div className="mt-2 flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="discount-fixed"
                                  name="discount-type"
                                  checked={discountType === 'fixed'}
                                  onChange={() => setDiscountType('fixed')}
                                  className="h-4 w-4 text-primary focus:ring-primary"
                                />
                                <label htmlFor="discount-fixed" className="text-sm text-secondary">
                                  Montant fixe
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="discount-percentage"
                                  name="discount-type"
                                  checked={discountType === 'percentage'}
                                  onChange={() => setDiscountType('percentage')}
                                  className="h-4 w-4 text-primary focus:ring-primary"
                                />
                                <label htmlFor="discount-percentage" className="text-sm text-secondary">
                                  Pourcentage
                                </label>
                              </div>
                            </div>
                            <div className="mt-2">
                              <input
                                type="number"
                                min="0"
                                max={discountType === 'percentage' ? 100 : subtotal}
                                className="block w-full rounded-md border-0 py-1.5 text-secondary shadow-sm ring-1 ring-inset ring-primary/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                              />
                            </div>
                          </div>
                          
                          {/* Totaux */}
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Sous-total:</span>
                              <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Remise:</span>
                              <span>-{formatCurrency(discountAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-primary/10 pt-2 font-medium">
                              <span>Total:</span>
                              <span>{formatCurrency(total)}</span>
                            </div>
                          </div>
                          
                          {/* Paiements - Optionnels pour vente débitrice */}
                          <div className="mt-4 border-t border-primary/10 pt-4">
                            <h4 className="font-medium text-secondary">Paiements (optionnel)</h4>
                            <p className="text-xs text-gray-500 mt-1">Pour une vente à crédit, vous pouvez accepter un paiement partiel ou aucun paiement initial.</p>
                            
                            {/* Liste des paiements */}
                            {payments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {payments.map((payment, index) => (
                                  <div key={index} className="flex items-center justify-between">
                                    <div className="text-sm">
                                      <span className="font-medium">{payment.method}</span>: {formatCurrency(payment.amount)}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePayment(index)}
                                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                                      title="Supprimer"
                                    >
                                      <XMarkIcon className="h-5 w-5 stroke-2" />
                                    </button>
                                  </div>
                                ))}
                                <div className="flex items-center justify-between pt-2 text-sm font-medium">
                                  <span>Total payé:</span>
                                  <span>{formatCurrency(totalPayments)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm font-medium">
                                  <span className="text-orange-600">Reste à payer:</span>
                                  <span className="text-orange-600">{formatCurrency(remainingAmount)}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Ajout d'un paiement */}
                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                              <div>
                                <select
                                  className="block w-full rounded-md border-0 py-1.5 text-secondary shadow-sm ring-1 ring-inset ring-primary/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                  value={currentPaymentMethod}
                                  onChange={(e) => setCurrentPaymentMethod(e.target.value as PaymentMethodType)}
                                >
                                  <option value="especes">Espèces</option>
                                  <option value="carte">Carte bancaire</option>
                                  <option value="wave">Wave</option>
                                  <option value="orange_money">Orange Money</option>
                                  <option value="cheque">Chèque</option>
                                  <option value="cheque_cadeau">Chèque cadeau</option>
                                  <option value="virement">Virement</option>
                                </select>
                              </div>
                              <div>
                                <input
                                  type="number"
                                  min="0"
                                  max={total}
                                  className="block w-full rounded-md border-0 py-1.5 text-secondary shadow-sm ring-1 ring-inset ring-primary/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                  placeholder="Montant (optionnel)"
                                  value={currentPaymentAmount || ''}
                                  onChange={(e) => setCurrentPaymentAmount(Number(e.target.value))}
                                />
                              </div>
                              <div>
                                <button
                                  type="button"
                                  onClick={handleAddPayment}
                                  disabled={currentPaymentAmount <= 0 || currentPaymentAmount > total}
                                  className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                  Ajouter
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 sm:ml-3 sm:w-auto"
                    onClick={handleSubmit}
                    disabled={!selectedClient || cart.length === 0 || isSubmitting}
                  >
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer vente à crédit'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-secondary shadow-sm ring-1 ring-inset ring-primary/10 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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