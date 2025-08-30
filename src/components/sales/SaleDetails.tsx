'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/client'
import { Sale, SaleItem, Client, User } from '@/types/appwrite.types'
import { formatCurrency } from '@/lib/utils/formatters'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Query } from 'appwrite'

export default function SaleDetails() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  
  const [sale, setSale] = useState<Sale | null>(null)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [seller, setSeller] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSaleDetails() {
      if (!id) {
        setError('Identifiant de vente manquant')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Récupérer la vente
        const saleData = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.SALES,
          id
        )
        setSale(saleData as Sale)
        
        // Récupérer les articles de la vente
        const itemsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SALE_ITEMS,
          [Query.equal('saleId', id)]
        )
        setSaleItems(itemsResponse.documents as SaleItem[])
        
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
        
        // Récupérer le vendeur
        if (saleData.userId) {
          try {
            const userData = await databases.getDocument(
              DATABASE_ID,
              'users', // Assurez-vous que c'est la bonne collection pour les utilisateurs
              saleData.userId
            )
            setSeller(userData as User)
          } catch (userError) {
            console.error('Erreur lors de la récupération du vendeur:', userError)
          }
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
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error || "Vente introuvable"}</p>
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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <button 
        onClick={() => router.back()}
        className="flex items-center text-primary hover:text-primary/80 mb-4"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Retour à la liste
      </button>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 text-center">
          <h1 className="text-lg text-gray-600 opacity-80">
            Vente #{sale.$id.substring(0, 8)}
          </h1>
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
                  <span className="text-gray-500">Méthode de paiement:</span>
                  <span>{formatPaymentMethod(sale.paymentMethod)}</span>
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
                      <td className="py-2 px-3">{item.quantity}</td>
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
              <div className="flex justify-between font-medium text-lg border-t border-gray-300 pt-2 mt-2">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
          
          {/* Informations sur le vendeur */}
          <div className="mt-8">
            {seller ? (
                  <p className="text-lg font-medium text-gray-700">
                    Vendeur: {seller.fullName}
                  </p>
            ) : (
              <p className="text-gray-500 italic">Informations vendeur non disponibles</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
