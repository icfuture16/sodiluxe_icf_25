'use client'

import { Sale } from '@/types/appwrite.types'
import UnifiedSaleDetails from './UnifiedSaleDetails'

interface SaleDetailsManagerProps {
  /** Vente à afficher */
  sale: Sale
  /** Afficher automatiquement les détails de crédit si c'est une vente à crédit */
  autoDetectCreditDetails?: boolean
  /** Forcer l'affichage des détails de crédit */
  showCreditDetails?: boolean
  /** Titre personnalisé */
  title?: string
  /** Classe CSS personnalisée */
  className?: string
  /** Callback appelé lors d'une action (ex: mise à jour du statut) */
  onSaleUpdate?: (updatedSale: Sale) => void
}

export default function SaleDetailsManager({
  sale,
  autoDetectCreditDetails = true,
  showCreditDetails,
  title,
  className = '',
  onSaleUpdate
}: SaleDetailsManagerProps) {
  // Déterminer si on doit afficher les détails de crédit
  const shouldShowCreditDetails = showCreditDetails ?? (autoDetectCreditDetails && sale.isCredit)

  // Générer le titre par défaut
  const getDefaultTitle = () => {
    if (sale.isCredit) {
      return `Détails de la vente à crédit #${sale.$id.slice(-8)}`
    }
    return `Détails de la vente #${sale.$id.slice(-8)}`
  }

  return (
    <div className={className}>
      {title && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
      )}
      
      <UnifiedSaleDetails 
        sale={sale}
        showCreditDetails={shouldShowCreditDetails}
        onSaleUpdate={onSaleUpdate}
      />
    </div>
  )
}

// Composant wrapper pour les ventes normales
export function NormalSaleDetailsManager(props: Omit<SaleDetailsManagerProps, 'showCreditDetails' | 'autoDetectCreditDetails'>) {
  return (
    <SaleDetailsManager 
      {...props}
      showCreditDetails={false}
      autoDetectCreditDetails={false}
    />
  )
}

// Composant wrapper pour les ventes à crédit
export function CreditSaleDetailsManager(props: Omit<SaleDetailsManagerProps, 'showCreditDetails' | 'autoDetectCreditDetails'>) {
  return (
    <SaleDetailsManager 
      {...props}
      showCreditDetails={true}
      autoDetectCreditDetails={false}
    />
  )
}