'use client'

import { useState, Suspense } from 'react'
import { BsCash, BsPeople, BsCart, BsBasket, BsBoxSeam, BsDownload } from 'react-icons/bs'
import { useDashboardData, DashboardData } from '@/hooks/useDashboardData'
import { useSavDebtorData } from '@/hooks/useSavDebtorData'
import QuickStat from '@/components/stats/QuickStat'
import RevenueChart from '@/components/stats/RevenueChart'
import StorePerformanceChart from '@/components/stats/StorePerformanceChart'
import CustomerSegmentChart from '@/components/stats/CustomerSegmentChart'
import TopProductsChart from '@/components/stats/TopProductsChart'
import DashboardAlerts from '@/components/stats/DashboardAlerts'
import DateRangeFilter from '@/components/filters/DateRangeFilter'
import PeriodFilter from '@/components/filters/PeriodFilter'
import ExportDialog from '@/components/dashboard/ExportDialog'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'
import { useAuth } from '@/providers/AuthProvider'

interface DashboardStatsProps {
  storeId?: string
}

export default function DashboardStats({ storeId }: DashboardStatsProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  
  // Récupérer l'utilisateur connecté et vérifier s'il est admin
  const { user, userProfile } = useAuth()
  const isAdmin = userProfile?.role === 'admin'
  
  // Conversion de la période pour le hook useDashboardData
  const convertPeriodForApi = () => {
    switch (period) {
      case 'today': return 'day'
      case 'week': return 'week'
      case 'month': return 'month'
      case 'custom': return 'custom'
      default: return 'day'
    }
  }
  
  // Utilisation du hook principal pour les données générales (respectant le filtre)
  const { data: apiData, isLoading, error } = useDashboardData({
    storeId,
    period: isAdmin ? convertPeriodForApi() : 'day', // Forcer 'day' pour les non-admin
    startDate: isAdmin && period === 'custom' ? startDate || undefined : undefined,
    endDate: isAdmin && period === 'custom' ? endDate || undefined : undefined
  })
  
  // Utilisation du hook spécialisé pour SAV et ventes débitrices (période fixe de 2 mois)
  const { data: savDebtorData, isLoading: isSavDebtorLoading } = useSavDebtorData({
    storeId
  })
  
  const emptyData: DashboardData = {
    sales: {
      id: 'sales',
      name: 'Ventes',
      value: 0,
      unit: 'count',
      period: '',
      updatedAt: new Date().toISOString(),
      changePercent: undefined
    },
    revenue: {
      id: 'revenue',
      name: 'Chiffre d\'affaires',
      value: 0,
      unit: 'XOF',
      period: '',
      updatedAt: new Date().toISOString(),
      changePercent: undefined
    },
    averageBasket: {
      id: 'avg_basket',
      name: 'Panier moyen',
      value: 0,
      unit: 'XOF',
      period: '',
      updatedAt: new Date().toISOString(),
      changePercent: undefined
    },
    customers: {
      id: 'customers',
      name: 'Clients',
      value: 0,
      unit: 'count',
      period: '',
      updatedAt: new Date().toISOString(),
      changePercent: undefined
    },
    newCustomers: {
      id: 'new_customers',
      name: 'Nouveaux clients',
      value: 0,
      unit: 'count',
      period: '',
      updatedAt: new Date().toISOString(),
      changePercent: undefined
    },
    products: {
      id: 'products',
      name: 'Produits vendus',
      value: 0,
      unit: 'count',
      period: '',
      updatedAt: new Date().toISOString(),
      topProducts: [],
      changePercent: undefined
    },
    serviceRequests: {
      id: 'service_requests',
      name: 'Demandes SAV',
      value: 0,
      unit: 'count',
      period: '',
      updatedAt: new Date().toISOString(),
      changePercent: undefined,
      total: 0,
      resolved: 0,
      cancelled: 0,
      pending: 0,
      breakdown: {
        byStatus: [
          { name: 'En attente', value: 0, color: 'bg-blue-500' },
          { name: 'En cours', value: 0, color: 'bg-yellow-500' },
          { name: 'Résolu', value: 0, color: 'bg-green-500' },
          { name: 'Annulée', value: 0, color: 'bg-red-500' }
        ]
      },
      type: 'sav',
      priority: 'medium' as const,
      responseTime: 0
    },
    reservations: {
      id: 'reservations',
      name: 'Réservations',
      value: 0,
      unit: 'count',
      period: '',
      updatedAt: new Date().toISOString(),
      changePercent: undefined
    },
    alerts: [],
    recentSales: []
  }
  
  // Utiliser les données de l'API ou les données vides en cas de chargement/erreur
  const dashboardData = apiData || emptyData
  
  // Données SAV et ventes débitrices avec période fixe de 2 mois
  const savDebtorDefaults = {
    serviceRequests: {
      id: 'serviceRequests',
      name: 'Demandes SAV',
      value: 0,
      total: 0,
      resolved: 0,
      cancelled: 0,
      pending: 0,
      breakdown: {
        byStatus: []
      },
      unit: 'demandes',
      period: '2 mois',
      updatedAt: new Date().toISOString(),
      changePercent: 0
    },
    debtorSales: {
      id: 'debtorSales',
      name: 'Ventes débitrices',
      value: 0,
      previousValue: 0,
      unit: 'XOF',
      period: '2 mois',
      updatedAt: new Date().toISOString(),
      changePercent: 0
    }
  }
  
  const savDebtorFinalData = savDebtorData || savDebtorDefaults

  // Pour les utilisateurs non-admin, forcer la période à 'today'
  const effectivePeriod = isAdmin ? period : 'today'

  // Filtrer les ventes du jour de l'utilisateur connecté
  const today = new Date();
  const recentSalesFiltered = Array.isArray(dashboardData.recentSales)
    ? dashboardData.recentSales.filter((sale: any) => {
        const saleDate = new Date(sale.date);
        const isToday = saleDate.getDate() === today.getDate() &&
                        saleDate.getMonth() === today.getMonth() &&
                        saleDate.getFullYear() === today.getFullYear();
        // Vérifier si l'id du vendeur correspond à l'utilisateur connecté
        return isToday && user && (sale.sellerId === user.$id || sale.userId === user.$id);
      })
    : [];

  // Afficher un message d'erreur si nécessaire
  if (error) {
    console.error('Erreur lors du chargement des données du tableau de bord:', error)
  }
  
  const handlePeriodChange = (newPeriod: 'today' | 'week' | 'month' | 'custom') => {
    setPeriod(newPeriod)
  }
  
  const handleCustomRangeChange = (start: Date, end: Date) => {
    setStartDate(start)
    setEndDate(end)
  }
  
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  // Nous utilisons maintenant le composant DashboardSkeleton importé directement dans page.tsx
  // Pas besoin de l'importer dynamiquement ici

  return (
    <>
      <div className="dashboard-fade-in">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Statistiques & Analyses</h1>
          <div className="dashboard-header-actions">
            <button
              onClick={() => setIsExportDialogOpen(true)}
              className="dashboard-export-button"
              disabled={isLoading || !!error}
            >
              <BsDownload className="h-4 w-4" />
              Exporter
            </button>
            {isAdmin && (
               <PeriodFilter 
                 selectedPeriod={period}
                 onPeriodChange={handlePeriodChange}
                 onDateRangeChange={handleCustomRangeChange}
                 startDate={startDate || undefined}
                 endDate={endDate || undefined}
               />
             )}
          </div>
        </div>
        
        {/* Message d'erreur */}
        {error && (
          <div className="dashboard-error-message">
            <p>Une erreur est survenue lors du chargement des données. Veuillez réessayer ultérieurement.</p>
            <button 
              onClick={() => window.location.reload()}
              className="dashboard-retry-button"
            >
              Réessayer
            </button>
          </div>
        )}
        
        {/* Afficher le squelette pendant le chargement */}
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* KPIs principaux */}
            <div className="dashboard-grid">
              <QuickStat 
                icon={BsCash} 
                label="Chiffre d'affaires"
                value={formatAmount(dashboardData.revenue.value)}
              />
              
              <QuickStat 
                icon={BsPeople} 
                label="Clients"
                value={dashboardData.customers.value}
              />
              
              <QuickStat 
                icon={BsCart} 
                label="Ventes du jour (vous)"
                value={recentSalesFiltered.length}
              />
              
              <QuickStat 
                icon={BsBasket} 
                label="Panier moyen"
                value={formatAmount(dashboardData.averageBasket.value)}
              />
              
              <QuickStat 
                icon={BsBoxSeam} 
                label="Nouveaux clients"
                value={dashboardData.newCustomers.value}
              />
              
              <QuickStat 
                icon={BsBoxSeam} 
                label="Demandes SAV (2 mois)"
                value={savDebtorFinalData.serviceRequests?.value || 0}
              />
            </div>
            
            {/* Section Ventes débitrices avec période fixe */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h3 className="dashboard-card-title">Ventes débitrices (2 derniers mois)</h3>
              </div>
              <div className="dashboard-grid">
                <QuickStat 
                  icon={BsCash} 
                  label="Total ventes débitrices"
                  value={formatAmount(savDebtorFinalData.debtorSales?.value || 0)}
                />
              </div>
            </div>
            
            {/* Graphiques principaux */}
            <div className="dashboard-grid dashboard-grid-primary">
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h2 className="dashboard-card-title">Évolution du chiffre d&apos;affaires</h2>
                </div>
                <div className="dashboard-chart-container">
                  <Suspense fallback={<div className="h-full w-full bg-gray-100 animate-pulse rounded-xl"></div>}>
                    {(() => {
  const revenueMetrics = dashboardData.revenue as import('@/hooks/useDashboardData').SalesMetrics;
  const byTimeOfDay: { name: string; value: number }[] = revenueMetrics?.breakdown?.byTimeOfDay ?? [];
  const byTimeOfDayLength = byTimeOfDay.length || 1;
  return (
    <RevenueChart
      data={byTimeOfDay.map((item: { name: string; value: number }) => ({
        date: item.name,
        revenue: item.value,
        target: 'target' in revenueMetrics && revenueMetrics.target
          ? revenueMetrics.target / byTimeOfDayLength
          : undefined
      }))}
    />
  );
})()}

                  </Suspense>
                </div>
              </div>
              
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h2 className="dashboard-card-title">Performance des boutiques</h2>
                </div>
                <div className="dashboard-chart-container">
                  <Suspense fallback={<div className="h-full w-full bg-gray-100 animate-pulse rounded-xl"></div>}>
                    <StorePerformanceChart 
                      data={(((dashboardData.revenue as import('@/hooks/useDashboardData').SalesMetrics)?.breakdown?.byStore ?? []) as { name: string; value: number }[]).map((item: { name: string; value: number }) => {
                          const revenueMetrics = dashboardData.revenue as import('@/hooks/useDashboardData').SalesMetrics;
                          const byStoreLength = revenueMetrics.breakdown?.byStore?.length || 1;
                          const target = 'target' in revenueMetrics && revenueMetrics.target ? 
                            revenueMetrics.target / byStoreLength : item.value;
                          return {
                            storeName: item.name,
                            revenue: item.value,
                            target,
                            achievement: target ? Math.round((item.value / target) * 100) : 0
                          };
                        })}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
            
            {/* Graphiques secondaires et alertes */}
            <div className="dashboard-secondary-grid">
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h2 className="dashboard-card-title">Segmentation clients</h2>
                </div>
                <div className="dashboard-chart-container">
                  <Suspense fallback={<div className="h-full w-full bg-gray-100 animate-pulse rounded-xl"></div>}>
                    <CustomerSegmentChart 
                      data={'segmentation' in dashboardData.customers ? dashboardData.customers.segmentation || [] : []}
                    />
                  </Suspense>
                </div>
              </div>
              
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h2 className="dashboard-card-title">Top produits</h2>
                </div>
                <div className="dashboard-chart-container">
                  <TopProductsChart 
                    data={dashboardData.products.topProducts || []}
                  />
                </div>
              </div>
              
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h2 className="dashboard-card-title">Alertes</h2>
                </div>
                <div className="dashboard-chart-container">
                  <DashboardAlerts 
                    alerts={dashboardData.alerts || []}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      <ExportDialog 
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        dashboardData={dashboardData}
        period={period === '7d' ? '7 derniers jours' : period === '30d' ? '30 derniers jours' : period === '90d' ? '90 derniers jours' : 'Période personnalisée'}
      />
    </>
  )
}