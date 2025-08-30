'use client'

import React, { useState, useEffect } from 'react'
import { FiPlus } from 'react-icons/fi'
import { BsShop, BsHeadset, BsCalendar, BsPersonCheck, BsClock, BsArrowUpRight, BsArrowDownRight, BsFileEarmarkText } from 'react-icons/bs'
import { useDashboardData } from '@/hooks/useDashboardData'

import { formatCurrency } from '@/lib/utils/formatters'
import StatCard from '../stats/StatCard'
import QuickStat from '../stats/QuickStat'
import SalesTrend from '../stats/SalesTrend'
import RecentSalesTable from '../sales/RecentSalesTable'
import NewSaleModal from '../sales/NewSaleModal'
import { useStores } from '@/hooks/useStores'
import { PermissionCheck } from '@/components/auth/PermissionCheck'
import { useAverageAfterSalesTime } from '@/hooks/useAverageAfterSalesTime'
import { useCachedClients } from '@/hooks/useCachedClients'
import { useAfterSalesServiceStats, useAfterSalesService } from '@/hooks/useAfterSalesService'
import { useCreditSales, useSales } from '@/hooks/useSales'


export default function Dashboard() {
  // États locaux
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'custom'>('today');
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(undefined);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  
  // Récupération des données
  const { data: storesData } = useStores();
  const { data: clients, isLoading: clientsLoading } = useCachedClients();
  const { data: avgAfterSalesHours, isLoading: isAvgSAVLoading } = useAverageAfterSalesTime();
  const { data: savStats, isLoading: savStatsLoading } = useAfterSalesServiceStats();
  const { data: savList } = useAfterSalesService(undefined, 'annulée');
  const { data: creditSales, isLoading: isCreditSalesLoading } = useCreditSales();
  // Récupérer toutes les ventes à crédit (y compris completed) pour les statistiques
  const { data: allCreditSales, isLoading: isAllCreditSalesLoading } = useSales({
    isCredit: true
  });

  
  const savStatsCancelled = Array.isArray(savList) ? savList.length : 0;
  
  // Calcul des statistiques des ventes débitrices
  const creditSalesStats = React.useMemo(() => {
    if (!allCreditSales || !Array.isArray(allCreditSales)) {
      return { pending: 0, paid: 0, overdue: 0 };
    }
    
    // Filtrer seulement les ventes à crédit
    const creditOnlySales = allCreditSales.filter(sale => sale.isCredit === true);
    
    const pending = creditOnlySales.filter(sale => sale.status === 'pending').length;
    const paid = creditOnlySales.filter(sale => sale.status === 'completed').length;
    
    // Une vente est en retard si elle est en attente ET créée il y a plus de 7 jours
    const overdue = creditOnlySales.filter(sale => {
      if (sale.status !== 'pending') return false;
      
      const createdAt = new Date(sale.$createdAt);
      const today = new Date();
      const daysDifference = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysDifference > 7;
    }).length;
    
    return { pending, paid, overdue };
  }, [allCreditSales]);
  
  // Récupération des données du dashboard
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData({
    storeId: selectedStoreId,
    period: selectedPeriod,
    startDate: customStartDate,
    endDate: customEndDate
  });

  // Calcul simple du nombre total de clients
  const clientsValue = React.useMemo(() => {
    if (clientsLoading || !clients) return '--';
    
    const totalClients = clients.length;
    const hommes = clients.filter(c => c.gender === 'homme').length;
    const femmes = clients.filter(c => c.gender === 'femme').length;
    const autres = totalClients - hommes - femmes; // Clients sans genre défini
    
    // Afficher "Autres" seulement s'il y en a
    const autresText = autres > 0 ? `   ? ${autres}` : '';
    
    return `Total : ${totalClients}\n♂️ ${hommes}   ♀️ ${femmes}${autresText}`;
   }, [clients, clientsLoading]);
  
  // Log des données reçues pour diagnostic (affiché uniquement en développement)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('--- DIAGNOSTIC DASHBOARD FRONT ---');
      console.log('DashboardData reçu:', dashboardData);
      console.log('StoresData reçu:', storesData);
      console.log('Clients reçus:', clients);
    }
  }, [dashboardData, storesData, clients]);
  
  // Calculs pour réservations par marque (Sillage et Gemaber)
  const reservationsByBrand = React.useMemo(() => {
    if (!storesData || !Array.isArray(dashboardData?.reservationsList)) return [];
    
    const brands = new Map();
    
    storesData.forEach(store => {
      const storeName = store.name.toLowerCase();
      let brandName = 'Autres';
      
      if (storeName.includes('sillage')) {
        brandName = 'Sillage';
      } else if (storeName.includes('gemaber')) {
        brandName = 'Gemaber';
      }
      
      if (!brands.has(brandName)) {
        brands.set(brandName, { brandName, storeIds: [], count: 0 });
      }
      
      brands.get(brandName).storeIds.push(store.$id);
    });
    
    // Calculer le nombre de réservations pour chaque marque
    brands.forEach((brand, brandName) => {
      brand.count = dashboardData.reservationsList.filter((resa: any) => 
        brand.storeIds.includes(resa.storeId)
      ).length;
    });
    
    return Array.from(brands.values());
  }, [storesData, dashboardData?.reservationsList]);


return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value as 'today' | 'week' | 'custom')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <h2 className="text-lg font-medium text-gray-900 mb-4">Statistiques rapides</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Clients */}
          <QuickStat 
            icon={BsPersonCheck} 
            label="Clients" 
            value={clientsValue}
          
          />
          
          {/* Temps moyen SAV */}
          <QuickStat 
            icon={BsClock} 
            label="Temps moyen SAV" 
            value={
              isAvgSAVLoading ? '--' : (avgAfterSalesHours && avgAfterSalesHours > 0 ? `${avgAfterSalesHours}h` : '--')
            }
          />
          
          {/* Ventes de la période */}
          <PermissionCheck requiredRole="admin">
            <QuickStat 
              icon={BsShop} 
              label={selectedPeriod === 'today' ? 'Ventes du jour' : selectedPeriod === 'week' ? 'Ventes de la semaine' : 'Ventes du mois'} 
              value={!isDashboardLoading && dashboardData?.revenue ? 
                `${(dashboardData.revenue?.value || 0).toLocaleString().replace(/,/g, ' ')} FCFA` : "--"} 
            />
          </PermissionCheck>
        </div>
        
        {/* Stat Cards - 4 badges sur une ligne horizontale */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Aperçu des ventes */}
          <StatCard title="Aperçu des ventes" icon={BsShop}>
            {!isDashboardLoading && (dashboardData?.revenue as import('@/hooks/useDashboardData').SalesMetrics)?.breakdown?.byStore ? (
              <div className="space-y-2">
                {((dashboardData?.revenue as import('@/hooks/useDashboardData').SalesMetrics)?.breakdown?.byStore ?? []).slice(0, 2).map((store: { name: string; value: number; color: string; salesCount?: number }, index: number) => (
                  <SalesTrend
                    key={index}
                    storeName={store.name}
                    storeInitial={store.name.charAt(0)}
                    trend={store.salesCount ?? 0}
                    description={store.salesCount === 1 ? '1 vente' : `${store.salesCount ?? 0} ventes`}
                  />
                ))}
                {!((dashboardData?.revenue as import('@/hooks/useDashboardData').SalesMetrics)?.breakdown?.byStore?.length) && (
                  <p className="text-xs text-gray-500">Aucune donnée disponible</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Chargement...</p>
            )}
          </StatCard>
          

          
          {/* SAV */}
          <StatCard title="SAV" icon={BsHeadset}>
            {!isDashboardLoading && dashboardData?.serviceRequests ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                   <span className="text-sm font-semibold text-gray-700">En attente</span>
                   <span className="inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                     {dashboardData?.serviceRequests?.waiting || 0}
                   </span>
                 </div>
                 <div className="flex items-center gap-1">
                   <span className="inline-block w-2 h-2 rounded-full bg-yellow-400"></span>
                   <span className="text-sm">En cours : {dashboardData.serviceRequests.breakdown?.byStatus?.find(s => s.name === 'En cours')?.value ?? 0}</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                   <span className="text-sm">Terminés : {dashboardData.serviceRequests.breakdown?.byStatus?.find(s => s.name === 'Résolu')?.value ?? 0}</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <span className="inline-block w-2 h-2 rounded-full bg-red-400"></span>
                   <span className="text-sm">Annulés : {dashboardData.serviceRequests.breakdown?.byStatus?.find(s => s.name === 'Annulée')?.value ?? 0}</span>
                 </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Chargement...</p>
            )}
          </StatCard>
          
          {/* Ventes Débitrices */}
          <StatCard title="Ventes Débitrices" icon={BsFileEarmarkText}>
            {!isAllCreditSalesLoading ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">En attente</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    {creditSalesStats.pending}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                  <span className="text-sm">Payées : {creditSalesStats.paid}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400"></span>
                  <span className="text-sm">En retard : {creditSalesStats.overdue}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Chargement...</p>
            )}
          </StatCard>
          
          {/* Réservations */}
          <StatCard title="Réservations" icon={BsCalendar}>
            {!isDashboardLoading && dashboardData?.reservationsList !== undefined && reservationsByBrand ? (
              <div className="space-y-1">
                 {reservationsByBrand.length > 0 ? (
                   reservationsByBrand.map(brand => (
                     <div key={brand.brandName} className="flex items-center gap-1">
                       <span className="text-sm font-semibold">{brand.brandName} :</span>
                       <span className="text-sm">{brand.count} réservation{brand.count > 1 ? 's' : ''}</span>
                     </div>
                   ))
                 ) : (
                   <div className="space-y-1">
                     <div className="flex items-center gap-1">
                       <span className="text-sm font-semibold">Gemaber :</span>
                       <span className="text-sm">0 réservation</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <span className="text-sm font-semibold">Sillage :</span>
                       <span className="text-sm">0 réservation</span>
                     </div>
                   </div>
                 )}
               </div>
            ) : (
              <p className="text-xs text-gray-400">Chargement...</p>
            )}
          </StatCard>
        </div>

        {/* Recent Sales */}
        <div className="mt-6">
          <StatCard title={selectedPeriod === 'today' ? 'Dernières ventes du jour' : selectedPeriod === 'week' ? 'Dernières ventes de la semaine' : 'Dernières ventes du mois'} icon={BsShop}>
  {!isDashboardLoading && dashboardData?.recentSales ? (
    dashboardData.recentSales.length > 0 ? (
      <RecentSalesTable sales={dashboardData.recentSales
        .filter((sale: any) => sale.date)
        .slice(0, 3) // Limiter à 3 ventes
        .map((sale: any) => ({
          ...sale,
          date: new Date(sale.date),
          customer: {
            name: sale.customer?.name || '',
            email: sale.customer?.email || ''
          },
          products: sale.products || [] // AJOUTER CETTE LIGNE
          // Pas de propriété 'seller' si non attendue
        }))} />
    ) : (
      <p className="text-sm text-gray-500">Aucune vente récente</p>
    )
  ) : (
    <p className="text-sm text-gray-400">Chargement des données de ventes...</p>
  )}
</StatCard>
        </div>
      </main>

      <NewSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={() => setIsNewSaleModalOpen(false)}
        storeId={selectedStoreId || ''}
        storeName={storesData?.find(store => store.$id === selectedStoreId)?.name || 'Magasin non sélectionné'}
      />
    </div>
  )
}
