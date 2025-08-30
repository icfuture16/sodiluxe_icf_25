'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/client'
import { Sale, SaleItem, Client, User, AuthUser, Store } from '@/types/appwrite.types'
import { formatCurrency } from '@/lib/utils/formatters'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Query } from 'appwrite'
import { authService } from '@/lib/appwrite/auth'
import AddPaymentModal from './AddPaymentModal'
import { BsCreditCard } from 'react-icons/bs'
import { getPaymentStats } from '@/lib/services/paymentService'

interface SaleDetailsClientProps {
  id: string
}

export default function SaleDetailsClient({ id }: SaleDetailsClientProps) {
  const router = useRouter()
  const [sale, setSale] = useState<Sale | null>(null)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [seller, setSeller] = useState<User | AuthUser | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false)

  useEffect(() => {
    async function fetchSaleDetails() {
      if (!id) return

      try {
        setLoading(true)
        
        // Récupérer la vente
        console.log('=== DÉBUT RÉCUPÉRATION VENTE ===');
        console.log('ID de la vente à récupérer:', id)
        console.log('DATABASE_ID:', DATABASE_ID)
        console.log('COLLECTIONS.SALES:', COLLECTIONS.SALES)
        
        const saleData = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.SALES,
          id
        )
        console.log('✅ Vente récupérée avec succès:', saleData)
        setSale(saleData as Sale)
        
        // Récupérer les articles de la vente
        console.log('=== RÉCUPÉRATION ARTICLES DE VENTE ===');
        const itemsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SALE_ITEMS,
          [Query.equal('saleId', id)]
        )
        console.log('✅ Articles de vente récupérés:', itemsResponse.documents.length, 'articles')
        const items = itemsResponse.documents as SaleItem[]
        
        // Récupérer les détails des produits pour chaque article
        const itemsWithProducts = await Promise.all(items.map(async (item) => {
          try {
            // Récupérer les informations du produit
            const productData = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.PRODUCTS,
              item.productId
            )
            return { ...item, product: productData }
          } catch (productError) {
            console.error('Erreur lors de la récupération du produit:', productError)
            return item
          }
        }))
        
        setSaleItems(itemsWithProducts as SaleItem[])
        
        // Récupérer le client
        if (saleData.clientId) {
          try {
            const clientData = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.CLIENTS,
              saleData.clientId
            )
            setClient(clientData as Client)
          } catch (clientError) {
            console.error('Erreur lors de la récupération du client:', clientError)
          }
        }
        
        // Récupérer la boutique
        if (saleData.storeId) {
          try {
            const storeData = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.STORES,
              saleData.storeId
            )
            setStore(storeData as Store)
          } catch (storeError) {
            console.error('Erreur lors de la récupération de la boutique:', storeError)
          }
        }
        
        // Utiliser directement user_seller pour le vendeur
        if (saleData.user_seller) {
          const sellerFromUserSeller = {
            $id: saleData.userId || 'unknown',
            fullName: saleData.user_seller,
            user_seller: saleData.user_seller,
            email: 'N/A',
            role: 'seller'
          } as User
          setSeller(sellerFromUserSeller)
          console.log('Utilisation du user_seller comme vendeur:', sellerFromUserSeller)
        } else if (saleData.userId) {
          // Fallback si user_seller n'est pas disponible
          const sellerFallback = {
            $id: saleData.userId,
            fullName: saleData.userId,
            user_seller: saleData.userId,
            email: 'N/A',
            role: 'seller'
          } as User
          setSeller(sellerFallback)
          console.log('Utilisation du userId comme fallback pour le vendeur:', sellerFallback)
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des détails de la vente:', err)
        setError('Impossible de récupérer les détails de la vente')
      } finally {
        setLoading(false)
      }
    }

    fetchSaleDetails()
  }, [id])

  // Fonction pour formater la méthode de paiement
  const formatPaymentMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      'especes': 'Espèces',
      'carte': 'Carte bancaire',
      'wave': 'Wave',
      'orange_money': 'Orange Money',
      'cheque': 'Chèque',
      'cheque_cadeau': 'Chèque cadeau',
      'virement': 'Virement'
    }

    return methodMap[method] || method
  }

  // Fonction pour formater le statut
  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      'completed': { label: 'Complété', color: 'text-green-600' },
      'pending': { label: 'En attente', color: 'text-yellow-600' },
      'cancelled': { label: 'Annulé', color: 'text-red-600' }
    }

    const defaultStatus = { label: status, color: 'text-gray-600' }
    const statusInfo = statusMap[status] || defaultStatus

    return <span className={statusInfo.color}>{statusInfo.label}</span>
  }



  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <div className="mt-4 text-gray-600">Chargement des détails de la vente...</div>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error || "Vente introuvable"}</p>
          <p className="text-gray-500 mt-2">ID recherché: {id}</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="flex items-center text-primary hover:text-primary/80"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Retour
        </button>
      </div>
    )
  }

  // Calculer les totaux
  const subtotal = saleItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  const discountAmount = sale.discountAmount || 0
  const total = sale.totalAmount || subtotal - discountAmount

  // Calculer les statistiques de paiement pour déterminer si c'est une vente débitrice
  const paymentStats = getPaymentStats(sale)
  const isCredit = sale.isCredit || paymentStats.remainingAmount > 0
  const isPartiallyPaid = paymentStats.remainingAmount > 0 && paymentStats.remainingAmount < total

  // Fonction pour gérer la mise à jour de la vente après ajout de paiement
  const handlePaymentAdded = (updatedSale: Sale) => {
    setSale(updatedSale)
    setIsAddPaymentModalOpen(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4 no-print">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-primary hover:text-primary/80"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Retour à la liste
        </button>
        <div className="flex items-center gap-3">
          {/* Bouton Compléter le paiement - visible uniquement pour les ventes débitrices non entièrement payées et non complétées */}
          {isCredit && paymentStats.remainingAmount > 0 && sale.status !== 'completed' && (
            <button 
              onClick={() => setIsAddPaymentModalOpen(true)}
              className="flex items-center bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
            >
              <BsCreditCard className="h-4 w-4 mr-1" />
              Compléter le paiement
            </button>
          )}
          
          {/* Bouton Imprimer */}
          <button 
            onClick={() => {
              // Fonction d'impression personnalisée pour n'imprimer que la facture
              const printContent = document.getElementById('printable-receipt');
              const originalBody = document.body.innerHTML;
              
              if (printContent) {
                // Sauvegarder le contenu original
                const originalContent = document.body.innerHTML;
                
                // Remplacer le contenu du body par uniquement la facture
                document.body.innerHTML = printContent.innerHTML;
                
                // Imprimer
                window.print();
                
                // Restaurer le contenu original
                document.body.innerHTML = originalContent;
              } else {
                // Fallback si l'élément n'est pas trouvé
                window.print();
              }
            }}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimer
          </button>
        </div>
      </div>
      
      <div id="printable-receipt" className="bg-white shadow-md rounded-lg overflow-hidden print-container">
        <div className="print-header">
          <h1 className="text-2xl font-bold text-center">SODILUXE</h1>
          <p className="text-center">Facture / Reçu de vente</p>
        </div>
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 text-center">
          <h3 className="text-lg text-gray-600 opacity-70">
            Vente #{sale.$id.substring(0, 8)}
          </h3>
        </div>
        
        <div className="px-4 py-3">
          {/* Informations générales */}
          <div className="grid grid-cols-5 gap-1 mb-6">
            <div className="col-span-2">
              <h2 className="text-lg font-medium text-gray-700 mb-2">Informations générales</h2>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Statut:</span>
                  <span>{formatStatus(sale.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span>{new Date(sale.saleDate || sale.$createdAt).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
            
            <div className="col-span-1"></div>
            
            <div className="col-span-2">
              <h2 className="text-lg font-medium text-gray-700 mb-2">Client</h2>
              {client ? (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nom:</span>
                    <span>{client.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span>{client.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Téléphone:</span>
                    <span>{client.phone}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">Informations client non disponibles</p>
              )}
            </div>
          </div>
          
          {/* Articles */}
          <h2 className="text-lg font-medium text-gray-700 mb-3">Articles</h2>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-left text-sm">
                  <th className="py-2 px-3 font-medium">Produit</th>
                  <th className="py-2 px-3 font-medium">Prix unitaire</th>
                  <th className="py-2 px-3 font-medium">Quantité</th>
                  <th className="py-2 px-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {saleItems.length > 0 ? (
                  saleItems.map((item) => (
                    <tr key={item.$id} className="border-b border-gray-200">
                      <td className="py-2 px-3">{item.product?.name || `Produit #${item.productId.substring(0, 8)}`}</td>
                      <td className="py-2 px-3">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 px-7">{item.quantity}</td>
                      <td className="py-2 px-3">{formatCurrency(item.unitPrice * item.quantity)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500 italic">
                      Aucun article trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Résumé financier */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-gray-700 mb-3">Résumé financier</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Sous-total:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Remise:</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
              
              {/* Méthodes de paiement */}
              <div className="space-y-1 mt-2">
                <div className="text-xs italic text-gray-500/80 mb-1">Méthodes de paiement</div>
                <div>
                  {(() => {
                    // Récupérer les paiements depuis les attributs séparés
                    const paymentMethods = ['especes', 'carte', 'wave', 'orange_money', 'cheque', 'cheque_cadeau', 'virement']
                    const payments = paymentMethods
                      .map(method => {
                        const amount = parseFloat((sale as any)[`payment_${method}`] || '0')
                        return amount > 0 ? { method: method as any, amount } : null
                      })
                      .filter(Boolean)
                    
                    if (payments.length > 0) {
                      // Si plus de 2 méthodes, afficher en 2 colonnes
                      if (payments.length > 2) {
                        return (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                            {payments.map((payment, index) => (
                              <div key={index} className="text-left text-xs italic text-gray-500/85">
                                <span>{formatPaymentMethod(payment!.method)}: </span>
                                <span>{formatCurrency(payment!.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )
                      } else {
                        // Si 2 méthodes ou moins, afficher en colonne simple
                        return (
                          <div className="space-y-0.5">
                            {payments.map((payment, index) => (
                              <div key={index} className="text-left text-xs italic text-gray-500/85">
                                <span>{formatPaymentMethod(payment!.method)}: </span>
                                <span>{formatCurrency(payment!.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )
                      }
                    } else {
                      return (
                        <div className="text-left text-xs italic text-gray-500/85">
                          <span>{formatPaymentMethod(sale.paymentMethod)}: </span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                      )
                    }
                  })()}
                </div>
              </div>
              <div className="flex justify-between font-medium text-lg border-t border-gray-300 pt-2 mt-2">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
          
          {/* Informations sur le vendeur */}
          <div className="mt-8">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-medium text-gray-500/70">Vendeur:</span>
              {seller ? (
                <span className="text-gray-600/80">{(seller as User)?.fullName || (seller as AuthUser)?.name || 'Vendeur inconnu'}</span>
              ) : (
                <span className="text-gray-400/70 italic">Informations vendeur non disponibles</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="print-footer mt-8 px-6 py-4 block">
          <p className="text-center text-gray-500 text-sm">Merci pour votre achat chez {store?.name || 'SODILUXE'}!</p>
          <p className="text-center text-gray-500 text-sm">Pour toute question, contactez-nous au {store?.phone || '+123 456 789'}</p>
        </div>
      </div>

      {/* Modal d'ajout de paiement */}
      <AddPaymentModal
        sale={sale}
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        onPaymentAdded={handlePaymentAdded}
      />
    </div>
  )
}
