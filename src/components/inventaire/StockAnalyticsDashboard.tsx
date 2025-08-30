'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts'
import { AlertTriangle, DollarSign, AlertCircle, BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import { useStores } from '@/hooks/useStores'
import { useStockAnalytics, StockAnalytics } from '@/hooks/useStock'
import { formatCurrency } from '@/lib/utils/formatters'

interface StockAnalyticsDashboardProps {
  storeId?: string
}

export default function StockAnalyticsDashboard({ storeId }: StockAnalyticsDashboardProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const { data: stores } = useStores()
  const { data: analytics, isLoading } = useStockAnalytics(storeId, period) as { data: StockAnalytics | undefined, isLoading: boolean }

  // Utilisation de la fonction formatCurrency importée depuis lib/utils/formatters

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-end">
        <Select value={storeId} onValueChange={() => {
          // La fonction de changement sera implémentée dans une future mise à jour
          // quand la sélection de magasin sera fonctionnelle
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les magasins" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les magasins</SelectItem>
            {stores?.map(store => (
              <SelectItem key={store.$id} value={store.$id}>{store.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="quarter">Ce trimestre</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Chargement des données...</div>
      ) : !analytics ? (
        <div className="text-center py-8 text-gray-500">
          Aucune donnée disponible
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Valeur totale du stock"
              value={formatCurrency(analytics.total_value)}
              icon={<DollarSign className="h-5 w-5" />}
              trend="neutral"
            />
            
            <MetricCard 
              title="Produits en stock faible"
              value={analytics.low_stock_count.toString()}
              icon={<AlertTriangle className="h-5 w-5" />}
              trend={analytics.low_stock_count > 5 ? "negative" : "neutral"}
            />
            
            <MetricCard 
              title="Produits en rupture"
              value={analytics.out_of_stock_count.toString()}
              icon={<AlertCircle className="h-5 w-5" />}
              trend={analytics.out_of_stock_count > 0 ? "negative" : "positive"}
            />
            
            <MetricCard 
              title="Rotation des stocks"
              value={analytics.inventory_turnover.toFixed(2)}
              icon={<BarChart3 className="h-5 w-5" />}
              trend={analytics.inventory_turnover > 4 ? "positive" : "neutral"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Top Produits en Mouvement</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.top_moving_products}
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="product_name" 
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, 'Quantité']} />
                      <Bar dataKey="total_quantity" fill="#3b82f6" name="Quantité" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Répartition des Stocks</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Stock normal', value: analytics.normal_stock_count },
                          { name: 'Stock faible', value: analytics.low_stock_count },
                          { name: 'Rupture', value: analytics.out_of_stock_count },
                          { name: 'Surstock', value: analytics.excess_stock_count },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: 'Stock normal', value: analytics.normal_stock_count },
                          { name: 'Stock faible', value: analytics.low_stock_count },
                          { name: 'Rupture', value: analytics.out_of_stock_count },
                          { name: 'Surstock', value: analytics.excess_stock_count },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Produits']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Évolution de la Valeur du Stock</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.stock_value_trend}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Valeur']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      name="Valeur du stock" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Produits à Faible Rotation</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Jours sans mouvement</TableHead>
                      <TableHead className="text-right">Quantité en stock</TableHead>
                      <TableHead className="text-right">Valeur immobilisée</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.slow_moving_products.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell className="font-medium">{product.product_name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="text-right">{product.days_without_movement}</TableCell>
                        <TableCell className="text-right">{product.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend?: 'positive' | 'negative' | 'neutral'
}

function MetricCard({ title, value, icon, trend = 'neutral' }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between">
          <div className="text-muted-foreground">{title}</div>
          <div className={`rounded-full p-2 ${
            trend === 'positive' ? 'bg-green-100 text-green-700' :
            trend === 'negative' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {icon}
          </div>
        </div>
        <div className="text-2xl font-bold mt-2">{value}</div>
        {trend !== 'neutral' && (
          <div className={`flex items-center mt-2 text-sm ${
            trend === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'positive' ? (
              <>
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>En hausse</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 mr-1" />
                <span>En baisse</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}