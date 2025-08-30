import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

interface ClientData {
  month: string
  nouveaux: number
  actifs: number
}

interface ClientSegment {
  name: string
  value: number
  color: string
}

interface ClientsChartProps {
  data: ClientData[] | ClientSegment[]
  title?: string
  isLoading?: boolean
}

// Vérifie si les données sont au format ClientData[] ou ClientSegment[]
function isClientDataArray(data: any[]): data is ClientData[] {
  return data.length > 0 && 'month' in data[0];
}

/**
 * Composant pour afficher un graphique de l'évolution des clients
 * 
 * @param data - Données des clients à afficher
 * @param title - Titre du graphique (optionnel)
 * @param isLoading - Indique si les données sont en cours de chargement
 */
export function ClientsChart({ data, title = "Évolution des Clients", isLoading = false }: ClientsChartProps) {
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
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
                <div className="h-32 bg-gray-100 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              <p>Aucune donnée disponible</p>
            </div>
          ) : isClientDataArray(data) ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="month" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip 
                  formatter={(value) => [value, '']} 
                  labelFormatter={(label) => `Mois: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actifs" 
                  stroke="#3b82f6" 
                  name="Clients actifs" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="nouveaux" 
                  stroke="#10b981" 
                  name="Nouveaux clients" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data as ClientSegment[]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(data as ClientSegment[]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, 'Clients']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}