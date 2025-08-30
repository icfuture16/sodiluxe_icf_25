import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils/formatters'

interface SalesData {
  month: string
  total: number
}

interface SalesChartProps {
  data: SalesData[]
  title?: string
  isLoading?: boolean
}

/**
 * Composant pour afficher un graphique des ventes
 * 
 * @param data - Données des ventes à afficher
 * @param title - Titre du graphique (optionnel)
 */
export function SalesChart({ data, title = "Ventes Mensuelles", isLoading = false }: SalesChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="space-y-4 w-full">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
                <div className="h-32 bg-gray-100 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              <p>Aucune donnée disponible</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => {
                    // Format simplifié pour l'axe Y (sans symbole de devise)
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)}K`
                    }
                    return value.toString()
                  }} 
                />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value as number), 'Ventes']} 
                  labelFormatter={(label) => `Mois: ${label}`}
                />
                <Bar 
                  dataKey="total" 
                  fill="#3b82f6" 
                  name="Ventes" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}