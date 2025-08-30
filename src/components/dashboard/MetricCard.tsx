import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string
  icon: ReactNode
  trend?: number
  trendLabel?: string
  trendSuffix?: string
  isLoading?: boolean
}

/**
 * Composant pour afficher une métrique avec tendance
 * 
 * @param title - Titre de la métrique
 * @param value - Valeur formatée de la métrique
 * @param icon - Icône à afficher
 * @param trend - Valeur de la tendance (positif = hausse, négatif = baisse)
 * @param trendLabel - Libellé de la tendance
 * @param trendSuffix - Suffixe à ajouter après la valeur de tendance (ex: "%")
 */
export function MetricCard({ 
  title, 
  value, 
  icon, 
  trend = 0, 
  trendLabel = "par rapport à la période précédente",
  trendSuffix = "%",
  isLoading = false
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {trend !== 0 && (
              <p className="text-xs text-muted-foreground">
                <span className={`flex items-center ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trend > 0 ? (
                    <ChevronUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {trend > 0 ? '+' : ''}{Math.abs(trend)}{trendSuffix} {trendLabel}
                </span>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}