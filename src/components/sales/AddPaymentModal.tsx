'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Sale } from '@/types/appwrite.types'
import { formatCurrency } from '@/lib/utils/formatters'
import { BsCash, BsCreditCard, BsPhone, BsBank, BsX, BsPlus } from 'react-icons/bs'
import { FaMoneyBillWave } from 'react-icons/fa'
import { addPaymentToSale, getPaymentStats, validatePayment } from '@/lib/services/paymentService'

interface AddPaymentModalProps {
  sale: Sale
  isOpen: boolean
  onClose: () => void
  onPaymentAdded: (updatedSale: Sale) => void
}

interface PaymentFormData {
  amount: string
  paymentMethod: string
  paymentDate: string
  notes: string
}

const PAYMENT_METHODS = [
  { value: 'especes', label: 'Espèces', icon: BsCash },
  { value: 'carte', label: 'Carte', icon: BsCreditCard },
  { value: 'wave', label: 'Wave', icon: FaMoneyBillWave },
  { value: 'orange_money', label: 'Orange Money', icon: BsPhone },
  { value: 'virement', label: 'Virement', icon: BsBank },
]

export default function AddPaymentModal({ sale, isOpen, onClose, onPaymentAdded }: AddPaymentModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    paymentMethod: 'especes',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const paymentStats = getPaymentStats(sale)
  const remainingAmount = paymentStats.remainingAmount

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error when user types
  }

  const validateForm = (): boolean => {
    const amount = Number(formData.amount)
    
    // Validation du montant avec le service
    const paymentValidation = validatePayment(sale, amount)
    if (!paymentValidation.valid) {
      setError(paymentValidation.error || 'Montant invalide')
      return false
    }

    if (!formData.paymentMethod) {
      setError('Veuillez sélectionner une méthode de paiement')
      return false
    }

    if (!formData.paymentDate) {
      setError('Veuillez sélectionner une date de paiement')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const paymentAmount = Number(formData.amount)
      
      // Utiliser le service de paiement pour ajouter le paiement
      const result = await addPaymentToSale(
        sale.$id,
        {
          amount: paymentAmount,
          method: formData.paymentMethod,
          date: formData.paymentDate,
          notes: formData.notes
        },
        'current_user', // TODO: Récupérer l'utilisateur actuel depuis le contexte d'auth
        queryClient
      )

      if (!result.success) {
        setError(result.error || 'Erreur lors de l\'ajout du paiement')
        return
      }

      if (result.updatedSale) {
        onPaymentAdded(result.updatedSale)
      }
      
      onClose()
      
      // Réinitialiser le formulaire
      setFormData({
        amount: '',
        paymentMethod: 'especes',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
      })
      
    } catch (err) {
      setError('Erreur lors de l\'ajout du paiement. Veuillez réessayer.')
      console.error('Erreur ajout paiement:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Ajouter un paiement
              </h3>
              <p className="text-sm text-gray-500">
                Vente #{sale.$id?.slice(-8)} - Reste à payer: {formatCurrency(remainingAmount)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <BsX className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Montant */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Montant du paiement *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0.01"
                  max={remainingAmount}
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.00"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">FCFA</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Maximum: {formatCurrency(remainingAmount)}
              </p>
            </div>

            {/* Méthode de paiement */}
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                Méthode de paiement *
              </label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date de paiement */}
            <div>
              <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-2">
                Date de paiement *
              </label>
              <input
                type="date"
                id="paymentDate"
                value={formData.paymentDate}
                onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Informations complémentaires sur ce paiement..."
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <BsPlus className="h-4 w-4 mr-2" />
                    Ajouter le paiement
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}