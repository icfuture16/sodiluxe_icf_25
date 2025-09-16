import { useQuery } from '@tanstack/react-query'
import { subMonths, startOfDay, endOfDay } from 'date-fns'
import { DataSource } from '@/lib/data/datasource'

interface SavDebtorFilters {
  storeId?: string
}

// Hook spécialisé pour SAV et ventes débitrices avec période fixe de 2 mois
export function useSavDebtorData(filters: SavDebtorFilters) {
  const { storeId } = filters
  
  // Période fixe de 2 mois
  const calculateFixedDateRange = () => {
    const now = new Date()
    const endDate = endOfDay(now)
    const startDate = startOfDay(subMonths(now, 2))
    
    return { startDate, endDate }
  }
  
  const { startDate, endDate } = calculateFixedDateRange()
  const dataSource = new DataSource()
  
  return useQuery({
    queryKey: ['sav-debtor-data', storeId, startDate, endDate],
    queryFn: async () => {
      // Récupérer les données SAV et ventes débitrices pour les 2 derniers mois
      const data = await dataSource.getOperationalData({
        startDate,
        endDate,
        storeId
      })
      
      // Retourner seulement les données SAV et ventes débitrices
      return {
        serviceRequests: data.serviceRequests,
        debtorSales: data.sales // Assumant que les ventes débitrices sont dans les données de vente
      }
    },
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  })
}

