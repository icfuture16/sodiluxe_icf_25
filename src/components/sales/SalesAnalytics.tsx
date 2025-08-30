import { useState } from 'react'
import { FiShoppingCart, FiTrendingUp, FiDollarSign, FiCalendar, FiUsers, FiPieChart, FiCalendar as FiDateRange, FiPrinter } from 'react-icons/fi'
import { useSales } from '@/hooks/useSales'
import { useStores } from '@/hooks/useStores'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

type PeriodType = '7d' | '30d' | '90d' | '1y' | 'custom'

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(amount).replace('XOF', 'FCFA')
}

// Create a simple Skeleton component
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className || ''}`} />
)

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

const Card = ({ className, children }: CardProps) => {
  return (
    <div className={`bg-white rounded-lg shadow ${className || ''}`}>
      {children}
    </div>
  );
};

export default function SalesAnalytics() {
  const { data: sales, isLoading, error } = useSales()
  const { data: stores } = useStores()
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('30d')
  const [selectedStore, setSelectedStore] = useState<string>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')


  // Calcul des statistiques de ventes en fonction des filtres
  const calculateSalesStats = () => {
    if (!sales || sales.length === 0) return null

    // Filtrer les ventes en fonction de la période sélectionnée
    const now = new Date()
    
    // Calculer la date de début de période
    const getPeriodStart = (): Date => {
      if (selectedPeriod === 'custom') {
        // Utiliser les dates personnalisées si elles sont définies
        if (customStartDate) {
          return new Date(customStartDate)
        } else {
          // Si aucune date personnalisée n'est définie, utiliser les 30 derniers jours par défaut
          const defaultStart = new Date(now)
          defaultStart.setDate(now.getDate() - 30)
          return defaultStart
        }
      } else {
        // Périodes prédéfinies
        const periodStart = new Date(now)
        switch (selectedPeriod) {
          case '7d':
            periodStart.setDate(now.getDate() - 7)
            break
          case '30d':
            periodStart.setDate(now.getDate() - 30)
            break
          case '90d':
            periodStart.setDate(now.getDate() - 90)
            break
          case '1y':
            periodStart.setFullYear(now.getFullYear() - 1)
            break
          default:
            periodStart.setDate(now.getDate() - 30)
        }
        return periodStart
      }
    }
    
    const periodStart = getPeriodStart()
    
    let filteredSales = sales.filter((sale) => {
      const saleDate = new Date(sale.saleDate || sale.$createdAt)
      
      // Filtrer par période personnalisée avec date de fin
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        const periodEnd = new Date(customEndDate)
        // Ajouter un jour à la date de fin pour inclure toute la journée
        periodEnd.setDate(periodEnd.getDate() + 1)
        // Vérifier si la vente est dans la période personnalisée
        if (!(saleDate >= periodStart && saleDate < periodEnd)) return false
      } else {
        // Vérifier si la vente est dans la période sélectionnée
        if (saleDate < periodStart) return false
      }
      
      // Filtrer par boutique si une boutique spécifique est sélectionnée
      if (selectedStore !== 'all' && sale.storeId !== selectedStore) return false
      
      return true
    })

    // Le filtrage par boutique est déjà fait dans le filter principal ci-dessus
    // Pas besoin de filtrer à nouveau

    const totalSales = filteredSales.length
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0
    
    const completedSales = filteredSales.filter(sale => sale.status === 'completed').length
    const pendingSales = filteredSales.filter(sale => sale.status === 'pending').length
    const cancelledSales = filteredSales.filter(sale => sale.status === 'cancelled').length

    // Ventes par magasin
    const storeStats = filteredSales.reduce((acc, sale) => {
      const storeName = sale.store?.name || 'Magasin inconnu'
      if (!acc[storeName]) {
        acc[storeName] = { count: 0, revenue: 0 }
      }
      acc[storeName].count += 1
      acc[storeName].revenue += sale.totalAmount || 0
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    const salesByStore = Object.entries(storeStats).map(([name, stats]) => ({
      name,
      value: stats.count,
      revenue: stats.revenue
    }))

    // Ventes par méthode de paiement
    const paymentStats = filteredSales.reduce((acc, sale) => {
      const method = sale.paymentMethod || 'Non spécifié'
      acc[method] = (acc[method] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const salesByPaymentMethod = Object.entries(paymentStats).map(([name, value]) => ({
      name: name === 'cash' ? 'Espèces' : name === 'card' ? 'Carte' : name === 'mobile' ? 'Mobile Money' : name,
      value
    }))

    // Ventes par période (dynamique selon le filtre sélectionné)
    const timeStats = (() => {
      // Déterminer l'intervalle approprié en fonction de la période sélectionnée
      let interval: 'day' | 'week' | 'month' = 'month';
      let format: { day?: 'numeric', month?: 'short', year?: 'numeric' } = { month: 'short', year: 'numeric' };
      let maxEntries = 6; // Nombre d'entrées par défaut
      
      if (selectedPeriod === '7d') {
        interval = 'day';
        format = { day: 'numeric', month: 'short' };
        maxEntries = 7;
      } else if (selectedPeriod === '30d') {
        interval = 'day';
        format = { day: 'numeric', month: 'short' };
        maxEntries = 10; // Regrouper par 3 jours environ
      } else if (selectedPeriod === '90d') {
        interval = 'week';
        format = { day: 'numeric', month: 'short' };
        maxEntries = 12; // Environ 12 semaines
      } else if (selectedPeriod === '1y' || selectedPeriod === 'custom') {
        interval = 'month';
        format = { month: 'short', year: 'numeric' };
        maxEntries = 12; // Jusqu'à 12 mois
      }
      
      // Créer un objet pour stocker les statistiques par période
      const stats: Record<string, { count: number; revenue: number }> = {};
      
      // Regrouper les ventes selon l'intervalle choisi
      filteredSales.forEach(sale => {
        const date = new Date(sale.saleDate || sale.$createdAt);
        let key: string;
        
        if (interval === 'day') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        } else if (interval === 'week') {
          // Obtenir le premier jour de la semaine (lundi)
          const day = date.getDate();
          const dayOfWeek = date.getDay() || 7; // 0 = dimanche, 1-6 = lundi-samedi, convertir dimanche en 7
          const monday = day - dayOfWeek + 1;
          const mondayDate = new Date(date);
          mondayDate.setDate(monday);
          key = `${mondayDate.getFullYear()}-${String(mondayDate.getMonth() + 1).padStart(2, '0')}-${String(mondayDate.getDate()).padStart(2, '0')}`;
        } else { // month
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        
        if (!stats[key]) {
          stats[key] = { count: 0, revenue: 0 };
        }
        stats[key].count += 1;
        stats[key].revenue += sale.totalAmount || 0;
      });
      
      return { stats, interval, format, maxEntries };
    })();
    
    // Transformer les données pour le graphique
    const salesByTime = Object.entries(timeStats.stats)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-timeStats.maxEntries) // Limiter au nombre d'entrées approprié
      .map(([timeKey, stats]) => {
        let displayDate: string;
        if (timeStats.interval === 'day') {
          displayDate = new Date(timeKey).toLocaleDateString('fr-FR', timeStats.format);
        } else if (timeStats.interval === 'week') {
          const startDate = new Date(timeKey);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          displayDate = `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
        } else { // month
          displayDate = new Date(timeKey + '-01').toLocaleDateString('fr-FR', timeStats.format);
        }
        
        return {
          period: displayDate,
          ventes: stats.count,
          revenus: stats.revenue
        };
      });

    // Top magasins par revenus
    const topSellingStores = salesByStore
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return {
      totalSales,
      totalRevenue,
      averageOrderValue,
      completedSales,
      pendingSales,
      cancelledSales,
      salesByStore,
      salesByPaymentMethod,
      salesByTime,
      topSellingStores
    }
  }

  const stats = calculateSalesStats()

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-4 w-16 mt-2" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4 h-80">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="flex justify-center items-center h-64">
              <Skeleton className="h-48 w-48 rounded-full" />
            </div>
          </Card>
          <Card className="p-4 h-80">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-64 w-full" />
          </Card>
      </div>
    </div>
  )}

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>Erreur lors du chargement des analyses de ventes.</p>
      </div>
    )
  }

  return (
    <>
      {/* Styles d'impression */}
      <style jsx>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0.4in;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            font-family: Arial, sans-serif !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            color: #000 !important;
            background: white !important;
          }
          
          .print-header {
            display: block !important;
            text-align: center !important;
            margin-bottom: 20px !important;
            padding-bottom: 15px !important;
            border-bottom: 2px solid #333 !important;
          }
          
          .print-header img {
            max-height: 60px;
            margin: 0 auto 10px;
          }
          
          .print-header h1 {
            font-size: 20px !important;
            font-weight: bold !important;
            margin: 10px 0 !important;
            color: #000 !important;
          }
          
          .print-header p {
            font-size: 12px !important;
            color: #666 !important;
            margin: 5px 0 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-optimize {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          
          .print-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            border: 1px solid #ddd !important;
            border-radius: 4px !important;
            padding: 12px !important;
            margin-bottom: 10px !important;
            background: white !important;
            box-shadow: none !important;
          }
          
          .print-stats-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 20px !important;
            page-break-inside: avoid !important;
          }
          
          .print-chart {
            height: 250px !important;
            width: 100% !important;
          }
          
          .print-table {
            font-size: 10px !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #ddd !important;
            padding: 4px 6px !important;
            text-align: left !important;
          }
          
          .print-table th {
            background-color: #f5f5f5 !important;
            font-weight: bold !important;
          }
          
          /* Améliorer l'affichage des graphiques */
          .recharts-wrapper {
            background: white !important;
          }
          
          .recharts-surface {
            background: white !important;
          }
          
          /* Optimiser les tableaux génériques */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10px !important;
          }
          
          table th,
          table td {
            border: 1px solid #ddd !important;
            padding: 4px 6px !important;
            text-align: left !important;
          }
          
          table th {
            background-color: #f5f5f5 !important;
            font-weight: bold !important;
          }
          
          /* Forcer l'affichage des couleurs */
          .bg-blue-100 { background-color: #dbeafe !important; }
          .bg-green-100 { background-color: #dcfce7 !important; }
          .bg-purple-100 { background-color: #f3e8ff !important; }
          .bg-amber-100 { background-color: #fef3c7 !important; }
          .bg-red-100 { background-color: #fee2e2 !important; }
          
          .text-blue-600 { color: #2563eb !important; }
          .text-green-600 { color: #16a34a !important; }
          .text-purple-600 { color: #9333ea !important; }
          .text-amber-600 { color: #d97706 !important; }
          .text-red-600 { color: #dc2626 !important; }
        }
      `}</style>
      
      <div className="space-y-6">
        {/* En-tête d'impression */}
        <div className="print-header" style={{ display: 'none' }}>
          <img 
            src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20elegant%20company%20logo%20with%20text%20SODILUXE%20professional%20business%20style%20blue%20and%20gold%20colors&image_size=landscape_4_3" 
            alt="Logo SODILUXE" 
          />
          <h1>Analyse des Ventes - SODILUXE</h1>
          <p>Rapport généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
          <p>Période: {selectedPeriod === '7d' ? '7 derniers jours' :
                     selectedPeriod === '30d' ? '30 derniers jours' :
                     selectedPeriod === '90d' ? '3 derniers mois' :
                     selectedPeriod === '1y' ? '12 derniers mois' :
                     selectedPeriod === 'custom' && customStartDate && customEndDate ? 
                       `${new Date(customStartDate).toLocaleDateString('fr-FR')} - ${new Date(customEndDate).toLocaleDateString('fr-FR')}` :
                       'période personnalisée'}</p>
        </div>
        
        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 no-print">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Filtre par boutique */}
            <div className="w-full md:w-64">
              <label htmlFor="store-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Boutique
              </label>
              <select
                id="store-filter"
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
              >
                <option value="all">Toutes les boutiques</option>
                {stores?.map((store) => (
                  <option key={store.$id} value={store.$id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sélecteur de dates personnalisées */}
            {selectedPeriod === 'custom' && (
              <div className="flex flex-col md:flex-row gap-2 items-end">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    className="rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    className="rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Filtres de période et bouton d'impression */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPeriod('7d')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                selectedPeriod === '7d'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setSelectedPeriod('30d')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                selectedPeriod === '30d'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 jours
            </button>
            <button
              onClick={() => setSelectedPeriod('90d')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                selectedPeriod === '90d'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              90 jours
            </button>
            <button
              onClick={() => setSelectedPeriod('1y')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                selectedPeriod === '1y'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              1 an
            </button>
            <button
              onClick={() => setSelectedPeriod('custom')}
              className={`px-3 py-2 text-sm font-medium rounded-md flex items-center ${
                selectedPeriod === 'custom'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiDateRange className="mr-1" /> Personnalisé
            </button>
            
            {/* Bouton d'impression */}
            <button
              onClick={() => window.print()}
              className="px-3 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center ml-2"
              title="Imprimer l'analyse des ventes"
            >
              <FiPrinter className="mr-1" /> Imprimer
            </button>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print-stats-grid print-optimize">
        <Card className="p-4 print-card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-full mr-4">
              <FiShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total des ventes</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalSales || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Toutes périodes</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 print-card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full mr-4">
              <FiDollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Total généré</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 print-card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-full mr-4">
              <FiTrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Panier moyen</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.averageOrderValue || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Par transaction</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-full mr-4">
              <FiUsers className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Ventes terminées</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.completedSales || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(stats?.totalSales || 0) > 0 ? Math.round(((stats?.completedSales || 0) / (stats?.totalSales || 1)) * 100) : 0}% du total
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-grid print-optimize">
        {/* Répartition par magasin */}
        <Card className="p-4 print-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiPieChart className="mr-2" />
            Ventes par magasin
          </h3>
          {(stats?.salesByStore?.length || 0) > 0 ? (
            <ResponsiveContainer width="100%" height={320} className="print-chart">
              <PieChart>
                <defs>
                  {(stats?.salesByStore || []).map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={stats?.salesByStore || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1000}
                  animationBegin={200}
                >
                  {(stats?.salesByStore || []).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#pieGradient${index})`}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </Card>

        {/* Évolution mensuelle */}
        <Card className="p-4 print-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiCalendar className="mr-2" />
            Évolution des ventes {selectedPeriod === '7d' ? '(7 derniers jours)' :
                                selectedPeriod === '30d' ? '(30 derniers jours)' :
                                selectedPeriod === '90d' ? '(3 derniers mois)' :
                                selectedPeriod === '1y' ? '(12 derniers mois)' :
                                selectedPeriod === 'custom' && customStartDate && customEndDate ? 
                                  `(${new Date(customStartDate).toLocaleDateString('fr-FR')} - ${new Date(customEndDate).toLocaleDateString('fr-FR')})` :
                                  '(période personnalisée)'}
          </h3>
          {stats?.salesByTime && (stats?.salesByTime?.length || 0) > 0 ? (
            <ResponsiveContainer width="100%" height={350} className="print-chart">
              <BarChart 
                data={stats?.salesByTime || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#667eea" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#764ba2" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f093fb" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f5576c" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e0e7ff" 
                  strokeOpacity={0.5}
                />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px'
                  }}
                  cursor={{ fill: 'rgba(102, 126, 234, 0.1)' }}
                />
                <Bar 
                  dataKey="ventes" 
                  fill="url(#salesGradient)" 
                  name="Nombre de ventes"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                  animationBegin={0}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </Card>
      </div>

      {/* Tableaux détaillés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-grid print-optimize">
        {/* Top magasins */}
        <Card className="p-4 print-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top magasins par revenus</h3>
          <div className="space-y-3">
            {(stats?.topSellingStores || []).map((store, index) => (
              <div key={store.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{store.name}</p>
                    <p className="text-sm text-gray-500">{store.value} ventes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(store.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Méthodes de paiement */}
        <Card className="p-4 print-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthodes de paiement</h3>
          <div className="space-y-3">
            {(stats?.salesByPaymentMethod || []).map((method, index) => (
              <div key={method.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <p className="font-medium text-gray-900">{method.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{method.value} ventes</p>
                  <p className="text-sm text-gray-500">
                    {(stats?.totalSales || 0) > 0 ? Math.round((method.value / (stats?.totalSales || 1)) * 100) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Statut des ventes */}
      <Card className="p-4 print-card print-optimize">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut des ventes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Terminées</p>
                <p className="text-2xl font-bold text-green-900">{stats?.completedSales || 0}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <FiUsers className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-900">{stats?.pendingSales || 0}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <FiCalendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Annulées</p>
                <p className="text-2xl font-bold text-red-900">{stats?.cancelledSales || 0}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <FiShoppingCart className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </>
  )
}