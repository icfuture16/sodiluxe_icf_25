import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/client'
import { Sale, PaymentMethodType } from '@/types/appwrite.types'
import { QueryClient } from '@tanstack/react-query'

export interface PaymentRecord {
  amount: number
  method: string
  date: string
  notes?: string
  timestamp: string
  addedBy: string
}

export interface PaymentUpdateResult {
  success: boolean
  updatedSale?: Sale
  error?: string
}

/**
 * Calcule le nouveau statut d'une vente en fonction du montant payé
 */
export function calculateSaleStatus(totalAmount: number, paidAmount: number): string {
  const remaining = totalAmount - paidAmount
  
  if (remaining <= 0) {
    return 'completed'
  } else if (paidAmount > 0) {
    return 'pending' // Une vente partiellement payée reste en attente
  } else {
    return 'pending'
  }
}

/**
 * Valide qu'un paiement peut être ajouté à une vente
 */
export function validatePayment(sale: Sale, paymentAmount: number): { valid: boolean; error?: string } {
  const safePaidAmount = Number(sale.paidAmount) || 0
  const safeTotalAmount = Number(sale.totalAmount) || 0
  const remainingAmount = safeTotalAmount - safePaidAmount

  if (paymentAmount <= 0) {
    return { valid: false, error: 'Le montant doit être supérieur à 0' }
  }

  if (paymentAmount > remainingAmount) {
    return { valid: false, error: `Le montant ne peut pas dépasser le reste à payer (${remainingAmount} FCFA)` }
  }

  if (remainingAmount <= 0) {
    return { valid: false, error: 'Cette vente est déjà entièrement payée' }
  }

  return { valid: true }
}

/**
 * Ajoute un paiement à une vente et met à jour son statut
 */
export async function addPaymentToSale(
  saleId: string,
  paymentData: Omit<PaymentRecord, 'timestamp' | 'addedBy'>,
  currentUserId?: string,
  queryClient?: QueryClient
): Promise<PaymentUpdateResult> {
  try {
    // Récupérer la vente actuelle
    const currentSale = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.SALES,
      saleId
    ) as Sale

    // Valider le paiement
    const validation = validatePayment(currentSale, paymentData.amount)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Calculer les nouveaux montants et statut
    const safeTotalAmount = Number(currentSale.totalAmount) || 0
    
    // Créer une copie temporaire de la vente avec le nouveau paiement ajouté
    const paymentMethodField = `payment_${paymentData.method}`
    const currentPaymentAmount = Number(currentSale[paymentMethodField as keyof Sale] || 0)
    const tempSale = {
      ...currentSale,
      [paymentMethodField]: (currentPaymentAmount + paymentData.amount).toString()
    } as Sale
    
    // Recalculer le montant total payé en sommant tous les champs payment_
    const newPaidAmount = calculateTotalPaidAmount(tempSale)
    const newStatus = calculateSaleStatus(safeTotalAmount, newPaidAmount)

    // Créer l'enregistrement de paiement avec audit trail
    const paymentRecord: PaymentRecord = {
      ...paymentData,
      timestamp: new Date().toISOString(),
      addedBy: currentUserId || 'system'
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      paidAmount: newPaidAmount,
      status: newStatus,
      remainingAmount: safeTotalAmount - newPaidAmount
    }

    // Mettre à jour le champ de paiement spécifique selon la méthode
    updateData[paymentMethodField] = (currentPaymentAmount + paymentData.amount).toString()

    // Mettre à jour la vente dans la base de données
    const updatedSale = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.SALES,
      saleId,
      updateData
    ) as Sale

    // Invalider les queries React Query pour rafraîchir la liste des ventes
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['all-sales'] })
    }

    return { success: true, updatedSale }

  } catch (error) {
    console.error('Erreur lors de l\'ajout du paiement:', error)
    return { 
      success: false, 
      error: 'Erreur lors de la sauvegarde du paiement. Veuillez réessayer.' 
    }
  }
}

/**
 * Récupère l'historique des paiements d'une vente
 * Note: Cette fonction est maintenant simulée car nous n'avons plus d'historique détaillé
 */
export function getPaymentHistory(sale: Sale): PaymentRecord[] {
  // Créer un historique simulé basé sur les montants par méthode de paiement
  const history: PaymentRecord[] = []
  
  const paymentMethods: PaymentMethodType[] = ['especes', 'carte', 'wave', 'orange_money', 'cheque', 'cheque_cadeau', 'virement']
  
  paymentMethods.forEach(method => {
    const fieldName = `payment_${method}` as keyof Sale
    const amount = Number(sale[fieldName] || 0)
    
    if (amount > 0) {
      history.push({
        amount,
        method,
        date: sale.$createdAt,
        timestamp: sale.$createdAt,
        addedBy: 'system'
      })
    }
  })
  
  return history
}

/**
 * Calcule le montant total payé en sommant tous les champs payment_
 */
export function calculateTotalPaidAmount(sale: Sale): number {
  const paymentMethods: PaymentMethodType[] = ['especes', 'carte', 'wave', 'orange_money', 'cheque', 'cheque_cadeau', 'virement']
  
  let totalPaid = 0
  paymentMethods.forEach(method => {
    const fieldName = `payment_${method}` as keyof Sale
    const amount = Number(sale[fieldName] || 0)
    totalPaid += amount
  })
  
  return totalPaid
}

/**
 * Calcule les statistiques de paiement d'une vente
 */
export function getPaymentStats(sale: Sale) {
  const safePaidAmount = Number(sale.paidAmount) || 0
  const safeTotalAmount = Number(sale.totalAmount) || 0
  const remainingAmount = safeTotalAmount - safePaidAmount
  const paymentPercentage = safeTotalAmount > 0 ? (safePaidAmount / safeTotalAmount) * 100 : 0

  return {
    totalAmount: safeTotalAmount,
    paidAmount: safePaidAmount,
    remainingAmount,
    paymentPercentage: Math.round(paymentPercentage * 100) / 100,
    isFullyPaid: remainingAmount <= 0,
    hasPartialPayment: safePaidAmount > 0 && remainingAmount > 0
  }
}

/**
 * Vérifie si une vente peut recevoir des paiements supplémentaires
 */
export function canAddPayment(sale: Sale): boolean {
  const stats = getPaymentStats(sale)
  return sale.isCredit && !stats.isFullyPaid && stats.remainingAmount > 0
}