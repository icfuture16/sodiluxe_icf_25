import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils/formatters'

interface SalesPeriodData {
  period: string
  total: number
  growth: number
}

interface SalesByPeriodProps {
  dailyData: SalesPeriodData[]
  weeklyData: SalesPeriodData[]
  monthlyData: SalesPeriodData[]
  title?: string
  isLoading?: boolean
}

/**
 * Composant pour afficher les statistiques de ventes par période (jour, semaine, mois)
 * 
 * @param dailyData - Données des ventes journalières
 * @param weeklyData - Données des ventes hebdomadaires
 * @param monthlyData - Données des ventes mensuelles
 * @param title - Titre du composant (optionnel)
 * @param isLoading - Indique si les données sont en cours de chargement
 */
export function SalesByPeriod({ 
  dailyData, 
  weeklyData, 
  monthlyData, 
  title = "Statistiques de Ventes",
  isLoading = false
}: SalesByPeriodProps) {
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  
  // Sélectionner les données en fonction de la période choisie
  const data = {
    'daily': dailyData || [],
    'weekly': weeklyData || [],
    'monthly': monthlyData || []
  }[periodType]
  
  // Calculer le total des ventes pour la période sélectionnée
  const totalSales = data.length > 0 ? data.reduce((sum, item) => sum + item.total, 0) : 0
  
  // Calculer la croissance moyenne
  const averageGrowth = data.length > 0 ? data.reduce((sum, item) => sum + item.growth, 0) / data.length : 0
  
  // Créer des placeholders pour l'état de chargement
  const loadingDetailPlaceholders = Array(5).fill(0).map((_, index) => (
    <div key={`loading-${index}`} className="flex items-center justify-between">
      <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4"></div>
      <div className="flex items-center space-x-2">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-16"></div>
        <div className="h-4 bg-gray-100 rounded animate-pulse w-8"></div>
      </div>
    </div>
  ));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Select
          value={periodType}
          onValueChange={(value) => setPeriodType(value as 'daily' | 'weekly' | 'monthly')}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Journalier</SelectItem>
            <SelectItem value="weekly">Hebdomadaire</SelectItem>
            <SelectItem value="monthly">Mensuel</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Total des ventes</p>
            {isLoading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse w-24 mt-1"></div>
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium">Croissance moyenne</p>
            {isLoading ? (
              <div className="h-6 bg-gray-100 rounded animate-pulse w-16 mt-1"></div>
            ) : (
              <div className="flex items-center">
                <p className={`text-xl font-bold ${averageGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {averageGrowth > 0 ? '+' : ''}{averageGrowth.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Détails par {periodType === 'daily' ? 'jour' : periodType === 'weekly' ? 'semaine' : 'mois'}</p>
            <div className="space-y-2">
              {isLoading ? (
                loadingDetailPlaceholders
              ) : data.length === 0 ? (
                <div className="py-2 text-center text-gray-400">
                  <p>Aucune donnée disponible</p>
                </div>
              ) : (
                data.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <p className="text-sm">{item.period}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{formatCurrency(item.total)}</p>
                      <span className={`text-xs ${item.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {item.growth > 0 ? '+' : ''}{item.growth}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}