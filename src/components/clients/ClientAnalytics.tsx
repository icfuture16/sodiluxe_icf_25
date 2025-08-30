import { useState } from 'react'
import { FiUsers, FiUserPlus, FiUserCheck, FiAlertTriangle, FiDollarSign, FiPieChart, FiPrinter } from 'react-icons/fi'
import { useClientAnalytics } from '@/hooks/useCachedClients'
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(amount).replace('XOF', 'FCFA')
}
import { ClientSegment } from '@/types/client.types'
// Create a simple Skeleton component since @mui/material is not available
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export default function ClientAnalytics() {
  const { data: analytics, isLoading, error } = useClientAnalytics()
  const [activeSegment, setActiveSegment] = useState<ClientSegment | null>(null)

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
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erreur!</strong>
        <span className="block sm:inline"> Impossible de charger les statistiques clients.</span>
      </div>
    )
  }

  // Données pour le graphique de segmentation
  const segmentationData = [
    { name: 'Premium', value: analytics.segmentation.premium.count, color: '#9333ea' },
    { name: 'Gold', value: analytics.segmentation.gold.count, color: '#eab308' },
    { name: 'Silver', value: analytics.segmentation.silver.count, color: '#94a3b8' },
    { name: 'Bronze', value: analytics.segmentation.bronze.count, color: '#d97706' },
  ]

  // Filtrer les segments avec des valeurs > 0 pour éviter les problèmes d'affichage
  const filteredSegmentationData = segmentationData.filter(item => item.value > 0)

  const handleSegmentClick = (data: any) => {
    if (data && data.name) {
      const segmentName = data.name.toLowerCase() as ClientSegment
      setActiveSegment(activeSegment === segmentName ? null : segmentName)
    }
  }

  return (
    <>
      {/* Styles d'impression */}
      <style jsx>{`
        @media print {
          @page {
            size: A4 portrait;
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
          
          .no-print {
            display: none !important;
          }
          
          .print-header {
            display: block !important;
            text-align: center !important;
            margin-bottom: 20px !important;
            padding-bottom: 15px !important;
            border-bottom: 2px solid #333 !important;
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
          
          .print-logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 10px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          
          .print-stats-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 20px !important;
            page-break-inside: avoid !important;
          }
          
          .print-charts-grid {
            display: block !important;
            margin-bottom: 20px !important;
          }
          
          .print-charts-grid > * {
            margin-bottom: 15px !important;
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
          
          .print-chart {
            height: 250px !important;
            width: 100% !important;
          }
          
          .print-optimize {
            font-size: 11px !important;
            line-height: 1.3 !important;
          }
          
          /* Améliorer l'affichage des graphiques */
          .recharts-wrapper {
            background: white !important;
          }
          
          .recharts-surface {
            background: white !important;
          }
          
          /* Optimiser les tableaux */
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
          
          .text-blue-600 { color: #2563eb !important; }
          .text-green-600 { color: #16a34a !important; }
          .text-purple-600 { color: #9333ea !important; }
          .text-amber-600 { color: #d97706 !important; }
        }
      `}</style>
      
      {/* En-tête d'impression */}
      <div className="print-header hidden">
        <div className="print-logo">
          SL
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Analyse des Clients</h1>
        <p className="text-gray-600">Rapport généré le {new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      
      <div className="space-y-6">
      {/* Bouton d'impression */}
      <div className="flex justify-end no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPrinter className="mr-2" size={16} />
          Imprimer
        </button>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print-stats-grid">
        <Card className="p-4 print-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FiUsers size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Clients</p>
              <h3 className="text-2xl font-bold">{analytics.overview.totalClients}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 print-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <FiUserPlus size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Nouveaux ce mois</p>
              <h3 className="text-2xl font-bold">{analytics.overview.newClientsThisMonth}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <FiUserCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Clients récents</p>
              <h3 className="text-2xl font-bold">{analytics.overview.recentClients}</h3>
              <p className="text-xs text-gray-500">
                Achat dans le mois
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4">
              <FiDollarSign size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Valeur client moyenne</p>
              <h3 className="text-2xl font-bold">{formatCurrency(analytics.overview.averageClv)}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-charts-grid">
        {/* Graphique de segmentation */}
        <Card className="p-4 print-card">
          <div className="flex items-center mb-4">
            <FiPieChart className="mr-2 text-gray-500" />
            <h3 className="font-medium text-gray-700">Segmentation des clients</h3>
          </div>
          <div className="h-64 print-chart">
            {filteredSegmentationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredSegmentationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    onClick={handleSegmentClick}
                  >
                    {filteredSegmentationData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke={activeSegment === entry.name.toLowerCase() ? '#000' : '#fff'}
                        strokeWidth={activeSegment === entry.name.toLowerCase() ? 2 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value} clients (${((value / analytics.overview.totalClients) * 100).toFixed(1)}%)`,
                      name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Pas assez de données pour afficher le graphique</p>
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Segment le plus rentable:</p>
              <p className="font-medium">
                {Object.entries(analytics.segmentation)
                  .sort(([, a], [, b]) => b.revenue - a.revenue)[0][0].charAt(0).toUpperCase() + 
                  Object.entries(analytics.segmentation)
                  .sort(([, a], [, b]) => b.revenue - a.revenue)[0][0].slice(1)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Segment le plus nombreux:</p>
              <p className="font-medium">
                {Object.entries(analytics.segmentation)
                  .sort(([, a], [, b]) => b.count - a.count)[0][0].charAt(0).toUpperCase() + 
                  Object.entries(analytics.segmentation)
                  .sort(([, a], [, b]) => b.count - a.count)[0][0].slice(1)}
              </p>
            </div>
          </div>
        </Card>

        {/* Top clients et clients à risque */}
        <Card className="p-4 print-card print-optimize">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <FiUsers className="mr-2 text-gray-500" />
              <h3 className="font-medium text-gray-700">Top clients</h3>
            </div>
          </div>
          <div className="space-y-4 mb-6">
            {analytics.topClients.length > 0 ? (
              analytics.topClients.map((client, index) => (
                <div key={client.$id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-6 text-gray-500">{index + 1}.</div>
                    <div>
                      <p className="font-medium">{client.fullName}</p>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(client.totalSpent)}</p>
                    <p className="text-xs text-gray-500">{client.loyaltyPoints} points</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">Aucun client disponible</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center mb-4">
              <FiAlertTriangle className="mr-2 text-amber-500" />
              <h3 className="font-medium text-gray-700">Clients à risque</h3>
            </div>
            <div className="space-y-4">
              {analytics.riskClients.length > 0 ? (
                analytics.riskClients.map((client) => (
                  <div key={client.$id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{client.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {client.lastPurchase 
                          ? `Dernier achat: ${new Date(client.lastPurchase).toLocaleDateString()}` 
                          : client.totalSpent > 0 
                            ? 'Aucun achat récent (données historiques)' 
                            : 'Aucun achat'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(client.totalSpent)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">Aucun client à risque</p>
              )}
            </div>
          </div>
        </Card>
      </div>
      </div>
    </>
  )
}