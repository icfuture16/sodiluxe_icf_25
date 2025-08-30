'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useCreateSale } from '@/hooks/useSales'
import { useAuth } from '@/providers/AuthProvider'
import { useDeleteCachedReservation } from '@/hooks/useCachedReservations'
import { formatCurrency } from '@/lib/utils/formatters'
import { Client, Product, Store } from '@/types/appwrite.types'
import { Reservation, ReservationItem } from '@/types/reservation.types'
import { toast } from 'sonner'

type ConvertReservationToSaleModalProps = {
  isOpen: boolean
  onClose: () => void
  reservation: Reservation
  reservationItems: ReservationItem[]
  client: Client
  store: Store
  products: Product[]
  onSuccess?: () => void
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

type SaleType = 'direct' | 'deferred'

export default function ConvertReservationToSaleModal({
  isOpen,
  onClose,
  reservation,
  reservationItems,
  client,
  store,
  products,
  onSuccess
}: ConvertReservationToSaleModalProps) {
  const [saleType, setSaleType] = useState<SaleType>('direct')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed')
  const [discountValue, setDiscountValue] = useState(0)
  const [payments, setPayments] = useState<PaymentSplit[]>([])
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethodType>('especes')
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState(0)
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0])

  const { user } = useAuth()
  const createSale = useCreateSale()
  const { mutate: deleteReservation } = useDeleteCachedReservation()

  // Pré-remplir le panier avec les articles de la réservation
  useEffect(() => {
    if (reservationItems && products) {
      const cartItems: CartItem[] = reservationItems.map(item => {
        const product = products.find(p => p.$id === item.productId)
        if (product) {
          return {
            product,
            quantity: item.quantity
          }
        }
        return null
      }).filter(Boolean) as CartItem[]
      
      setCart(cartItems)
    }
  }, [reservationItems, products])

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
  
  // Déduire l'acompte payé de la réservation si applicable
  const depositToDeduct = reservation?.depositPaid && reservation?.depositAmount ? reservation.depositAmount : 0
  const adjustedTotal = total - depositToDeduct
  
  // Calcul du total des paiements
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  
  // Montant restant à payer (en tenant compte de l'acompte déduit)
  const remainingAmount = Math.max(0, adjustedTotal - totalPayments)

  // Pour les ventes débitrices, pas besoin de paiement immédiat
  const isPaymentRequired = saleType === 'direct'

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
    if (!client || !store || !user || cart.length === 0) return
    
    // Pour les ventes directes, vérifier que le montant total est payé (en tenant compte de l'acompte déduit)
    if (isPaymentRequired && totalPayments < adjustedTotal) {
      toast.error('Le montant total doit être payé pour une vente directe')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Déterminer la méthode de paiement principale et le statut selon le type de vente
      let mainPaymentMethod: PaymentMethodType = 'especes'
      let saleStatus = 'completed'
      
      if (saleType === 'deferred') {
        // Vente débitrice
        mainPaymentMethod = 'especes' // Valeur par défaut pour les ventes débitrices
        saleStatus = 'pending'
      } else if (payments.length > 0) {
        // Vente directe avec paiements
        const paymentsByAmount = [...payments].sort((a, b) => b.amount - a.amount)
        mainPaymentMethod = paymentsByAmount[0].method
      }

      // Créer l'objet de vente
      const saleData: any = {
        clientId: client.$id,
        storeId: store.$id,
        userId: user.$id,
        user_seller: user.$id, // ID du vendeur (utilisateur connecté)
        isCredit: saleType === 'deferred', // true pour ventes débitrices, false pour ventes directes
        totalAmount: adjustedTotal,
        discountAmount: discountAmount,
        paymentMethod: mainPaymentMethod,
        status: saleStatus,
        saleDate: new Date(saleDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString(),
        notes: `Convertie depuis la réservation ${reservation.$id}`, // Tracer l'origine de la vente
      }
      
      // Ajouter les montants de paiement par méthode
      const paymentMethods = ['especes', 'carte', 'wave', 'orange_money', 'cheque', 'cheque_cadeau', 'virement']
      paymentMethods.forEach(method => {
        saleData[`payment_${method}`] = "0"
      })
      
      // Mettre à jour avec les montants réels pour les ventes directes
      if (saleType === 'direct') {
        payments.forEach(payment => {
          saleData[`payment_${payment.method}`] = payment.amount.toString()
        })
      }
      
      await createSale.mutateAsync({
        sale: saleData,
        items: cart.map((item) => ({
          productId: item.product.$id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          discountAmount: 0, // Pour l'instant, pas de remise par article
        })),
      })

      toast.success(`Vente ${saleType === 'direct' ? 'directe' : 'débitrice'} créée avec succès`)
      
      // Supprimer la réservation après conversion réussie
      deleteReservation({ reservationId: reservation.$id })
      
      // Appeler le callback de succès si fourni
      if (onSuccess) {
        onSuccess()
      }
      
      onClose()
    } catch (error) {
      console.error('Error creating sale:', error)
      toast.error('Erreur lors de la création de la vente')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setSaleType('direct')
      setDiscountAmount(0)
      setDiscountValue(0)
      setPayments([])
      setCurrentPaymentAmount(0)
      setSaleDate(new Date().toISOString().split('T')[0])
    }
  }, [isOpen])

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
                      Convertir la réservation en vente
                    </Dialog.Title>

                    {/* Informations de la réservation */}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Réservation:</span>
                        <span className="text-gray-600">#{reservation.$id.slice(-8)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Date:</span>
                        <span className="text-gray-600">{new Date(saleDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Magasin:</span>
                        <span className="text-gray-600">{store.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Vendeur:</span>
                        <span className="text-gray-600">{user?.name || 'Non défini'}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      
                      {/* Type de vente */}
                      <div>
                        <label className="block text-sm font-medium text-secondary">
                          Type de vente
                        </label>
                        <div className="mt-2 flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="sale-direct"
                              name="sale-type"
                              checked={saleType === 'direct'}
                              onChange={() => setSaleType('direct')}
                              className="h-4 w-4 text-primary focus:ring-primary"
                            />
                            <label htmlFor="sale-direct" className="text-sm text-secondary">
                              Vente directe (paiement immédiat)
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="sale-deferred"
                              name="sale-type"
                              checked={saleType === 'deferred'}
                              onChange={() => setSaleType('deferred')}
                              className="h-4 w-4 text-primary focus:ring-primary"
                            />
                            <label htmlFor="sale-deferred" className="text-sm text-secondary">
                              Vente débitrice (paiement différé)
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Client pré-rempli */}
                      <div className="rounded-md bg-primary/5 p-4">
                        <h4 className="font-medium text-secondary mb-2">Client</h4>
                        <div className="font-medium text-secondary">
                          {client.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          Adresse: {client.address}
                        </div>
                        <div className="text-sm text-gray-500">
                          Genre: {client.gender === 'homme' ? 'Homme' : client.gender === 'femme' ? 'Femme' : 'Entreprise'}
                        </div>
                        {client.loyaltyPoints > 0 && (
                          <div className="mt-1 text-sm text-primary">
                            Points de fidélité: {client.loyaltyPoints}
                          </div>
                        )}
                      </div>

                      {/* Panier pré-rempli */}
                      {cart.length > 0 && (
                        <div>
                          <h4 className="font-medium text-secondary">Articles de la réservation</h4>
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
                            {depositToDeduct > 0 && (
                              <div className="flex items-center justify-between text-sm text-green-600">
                                <span>Acompte déduit:</span>
                                <span>-{formatCurrency(depositToDeduct)}</span>
                              </div>
                            )}
                            {depositToDeduct > 0 && (
                              <div className="flex items-center justify-between text-lg font-bold border-t pt-2">
                                <span>Total après acompte:</span>
                                <span>{formatCurrency(adjustedTotal)}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Paiements - seulement pour les ventes directes */}
                          {saleType === 'direct' && (
                            <div className="mt-4 border-t border-primary/10 pt-4">
                              <h4 className="font-medium text-secondary">Paiements</h4>
                              
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
                                    <span>Reste à payer:</span>
                                    <span>{formatCurrency(remainingAmount)}</span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Ajout d'un paiement */}
                              {remainingAmount > 0 && (
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
                                      max={remainingAmount}
                                      className="block w-full rounded-md border-0 py-1.5 text-secondary shadow-sm ring-1 ring-inset ring-primary/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                      placeholder="Montant"
                                      value={currentPaymentAmount || ''}
                                      onChange={(e) => setCurrentPaymentAmount(Number(e.target.value))}
                                    />
                                  </div>
                                  <div>
                                    <button
                                      type="button"
                                      onClick={handleAddPayment}
                                      disabled={currentPaymentAmount <= 0 || currentPaymentAmount > remainingAmount}
                                      className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                      Ajouter
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Message pour vente débitrice */}
                          {saleType === 'deferred' && (
                            <div className="mt-4 border-t border-primary/10 pt-4">
                              <div className="rounded-md bg-yellow-50 p-4">
                                <div className="text-sm text-yellow-800">
                                  <strong>Vente débitrice:</strong> Le paiement sera effectué ultérieurement. 
                                  La vente sera marquée comme en attente de paiement.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 sm:ml-3 sm:w-auto"
                    onClick={handleSubmit}
                    disabled={!client || cart.length === 0 || isSubmitting || (isPaymentRequired && totalPayments < total)}
                  >
                    {isSubmitting ? 'Création...' : `Créer la vente ${saleType === 'direct' ? 'directe' : 'débitrice'}`}
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