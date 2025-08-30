import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface CategoryData {
  name: string
  value: number
}

interface CategoryPieChartProps {
  data: CategoryData[]
  title?: string
  colors?: string[]
  isLoading?: boolean
}

/**
 * Composant pour afficher un graphique en camembert des catégories
 * 
 * @param data - Données des catégories à afficher
 * @param title - Titre du graphique (optionnel)
 * @param colors - Couleurs à utiliser pour les segments (optionnel)
 */
export function CategoryPieChart({ 
  data, 
  title = "Répartition des Ventes par Catégorie",
  colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'],
  isLoading = false
}: CategoryPieChartProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="space-y-4 w-full">
                <div className="h-32 w-32 rounded-full bg-gray-200 animate-pulse mx-auto"></div>
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              <p>Aucune donnée disponible</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Pourcentage']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}