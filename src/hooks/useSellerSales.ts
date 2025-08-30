import { useQuery } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { useErrorHandler } from './useErrorHandler'
import { startOfMonth, endOfMonth } from 'date-fns'

/**
 * Hook pour récupérer les ventes d'un vendeur spécifique
 * @param sellerId ID du vendeur
 * @param month Mois pour filtrer (optionnel, par défaut le mois actuel, null pour toutes les ventes)
 * @returns Ventes du vendeur et statistiques
 */
export function useSellerSales(sellerId?: string, month?: Date | null) {
  const handleError = useErrorHandler()
  const shouldFilterByMonth = month !== null
  const currentMonth = month || new Date()
  const startDate = shouldFilterByMonth ? startOfMonth(currentMonth) : null
  const endDate = shouldFilterByMonth ? endOfMonth(currentMonth) : null

  return useQuery({
    queryKey: ['sellerSales', sellerId, startDate?.toISOString() || 'all', endDate?.toISOString() || 'all'],
    queryFn: async () => {
      if (!sellerId) {
        return {
          sales: [],
          totalRevenue: 0,
          salesCount: 0,
          averageTicket: 0
        }
      }

      try {
        console.log('Fetching sales for seller:', sellerId, shouldFilterByMonth ? 'with month filter' : 'all sales')
        
        // Récupérer les ventes du vendeur
        const queries = [
          Query.equal('userId', sellerId),
          Query.equal('status', 'completed'), // Seulement les ventes complétées
          Query.orderDesc('$createdAt')
        ]
        
        // Ajouter le filtrage par date seulement si nécessaire
        if (shouldFilterByMonth && startDate && endDate) {
          queries.push(
            Query.greaterThanEqual('$createdAt', startDate.toISOString()),
            Query.lessThanEqual('$createdAt', endDate.toISOString())
          )
        }
        
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SALES,
          queries
        )
        
        const sales = response.documents
        
        // Calculer les statistiques
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
        const salesCount = sales.length
        const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0
        
        console.log(`Seller ${sellerId} stats:`, {
          salesCount,
          totalRevenue,
          averageTicket
        })
        
        return {
          sales,
          totalRevenue,
          salesCount,
          averageTicket
        }
        
      } catch (error: any) {
        handleError(error, 'Impossible de récupérer les ventes du vendeur')
        throw error
      }
    },
    enabled: !!sellerId, // Ne pas exécuter si pas de sellerId
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      return failureCount < 3
    },
  })
}

/**
 * Hook pour récupérer le chiffre d'affaires mensuel d'un vendeur
 * @param sellerId ID du vendeur
 * @param month Mois pour filtrer (optionnel, par défaut le mois actuel)
 * @returns Chiffre d'affaires mensuel
 */
export function useSellerMonthlyRevenue(sellerId?: string, month?: Date) {
  const { data, isLoading, error } = useSellerSales(sellerId, month)
  
  return {
    revenue: data?.totalRevenue || 0,
    salesCount: data?.salesCount || 0,
    averageTicket: data?.averageTicket || 0,
    isLoading,
    error
  }
}