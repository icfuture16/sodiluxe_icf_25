import { useQuery } from '@tanstack/react-query'
import { startOfDay, subDays, startOfWeek, startOfMonth, endOfDay } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { DataSource } from '@/lib/data/datasource'

type DashboardPeriod = 'today' | 'day' | 'week' | 'month' | 'custom'

interface DashboardFilters {
  storeId?: string
  period: DashboardPeriod
  startDate?: Date
  endDate?: Date
}

export function useDashboardData(filters: DashboardFilters) {
  const { storeId, period, startDate: customStartDate, endDate: customEndDate } = filters
  
  // Calculer les dates de début et de fin en fonction de la période
  const calculateDateRange = () => {
    const now = new Date()
    const endDate = endOfDay(now)
    let startDate: Date
    
    switch (period) {
      case 'today':
      case 'day':
        startDate = startOfDay(now)
        break
      case 'week':
        startDate = startOfWeek(now, { locale: fr })
        break
      case 'month':
        startDate = startOfMonth(now)
        break
      case 'custom':
        if (customStartDate && customEndDate) {
          return { startDate: customStartDate, endDate: customEndDate }
        }
        // Fallback à aujourd'hui si les dates personnalisées ne sont pas définies
        startDate = startOfDay(now)
        break
      default:
        startDate = startOfDay(now)
    }
    
    return { startDate, endDate }
  }
  
  // Calcul dynamique de la période selon le filtre utilisateur
  const { startDate, endDate } = calculateDateRange()
  const dataSource = new DataSource()
  
  return useQuery({
    queryKey: ['dashboard', storeId, period, startDate, endDate],
    queryFn: async () => {
      return dataSource.getOperationalData({
        startDate,
        endDate,
        storeId
      })
    },
    enabled: true,
    staleTime: 30 * 1000, // 30 secondes - rafraîchissement quasi temps réel
    refetchInterval: 2 * 60 * 1000, // 2 minutes - mise à jour fréquente
    refetchOnWindowFocus: true, // Rafraîchissement au focus de la fenêtre
  })
}

// Types pour les données du tableau de bord
export interface BaseKPI {
  id: string
  name: string
  value: number
  previousValue?: number
  target?: number
  unit: string
  trend?: number
  changePercent?: number
  period: string
  updatedAt: string
}

export interface SalesMetrics extends BaseKPI {
  breakdown?: {
    byStore?: { name: string; value: number; color: string; salesCount?: number }[]
    byCategory?: { name: string; value: number; color: string }[]
    byPaymentMethod?: { name: string; value: number; color: string }[]
    byTimeOfDay?: { name: string; value: number; color: string }[]
  }
}

export interface CustomerMetrics extends BaseKPI {
  segmentation?: {
    name: string
    value: number
    color: string
  }[]
  acquisition?: {
    name: string
    value: number
    color: string
  }[]
}

export interface ProductMetrics extends BaseKPI {
  topProducts?: {
    productId: string
    name: string
    sales: number
    revenue: number
    margin: number
  }[]
  categories?: {
    name: string
    performance: number
    trend: number
  }[]
}

export interface ServiceMetrics extends BaseKPI {
  total: number;
  resolved: number;
  cancelled: number;
  pending: number;
  breakdown: {
    byStatus: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  };
  type?: string;
  priority?: 'high' | 'medium' | 'low';
  responseTime?: number;
  // Propriétés héritées de BaseKPI
  id: string;
  name: string;
  value: number;
  unit: string;
  period: string;
  updatedAt: string;
  changePercent?: number;
}

export interface ReservationMetrics extends BaseKPI {
  status?: 'confirmed' | 'pending' | 'cancelled'
  showUpRate?: number // taux de présentation en %
}

export interface DashboardData {
  clientsList?: any[];
  reservationsList?: any[];
  sales: SalesMetrics
  revenue: SalesMetrics
  averageBasket: SalesMetrics
  customers: CustomerMetrics
  newCustomers: CustomerMetrics
  products: ProductMetrics
  // Ajout des données SAV
  serviceRequests: ServiceMetrics
  // Ajout des données Réservations
  reservations: ReservationMetrics
  alerts: {
    id: string
    type: 'warning' | 'success' | 'info'
    message: string
    date: string
  }[]
  recentSales: {
    id: string
    date: Date
    customer: {
      name: string
      email: string
    }
    store: string
    amount: number
    status: 'completed' | 'pending' | 'cancelled'
    products: {
      name: string
      quantity: number
    }[]
  }[]
}

