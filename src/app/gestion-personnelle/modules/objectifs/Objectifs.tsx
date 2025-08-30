'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSales } from '@/hooks'
import { useAuth } from '@/providers/AuthProvider'
import { formatCurrency } from '@/lib/utils/formatters'
import { format, startOfMonth, endOfMonth, isWithinInterval, isSameMonth, subMonths, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { DatePickerWithRange } from '@/components/ui/date-picker'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

// Types pour les objectifs
type Objective = {
  id: string
  title: string
  target: number
  current: number
  unit: string
  category: 'ventes' | 'clients' | 'produits'
}

// Données de démo pour les objectifs
const demoObjectives: Objective[] = [
  {
    id: 'obj1',
    title: 'Chiffre d\'affaires',
    target: 10000,
    current: 7500,
    unit: '€',
    category: 'ventes'
  },
  {
    id: 'obj2',
    title: 'Nombre de ventes',
    target: 50,
    current: 35,
    unit: 'ventes',
    category: 'ventes'
  },
  {
    id: 'obj3',
    title: 'Nouveaux clients',
    target: 15,
    current: 10,
    unit: 'clients',
    category: 'clients'
  },
  {
    id: 'obj4',
    title: 'Produits premium',
    target: 20,
    current: 12,
    unit: 'produits',
    category: 'produits'
  },
  {
    id: 'obj5',
    title: 'Vente d\'accessoires',
    target: 30,
    current: 28,
    unit: 'produits',
    category: 'produits'
  }
]

// Données d'exemple pour l'historique des ventes
const demoSalesHistory = [
  { month: 'Jan', amount: 5800 },
  { month: 'Fév', amount: 6500 },
  { month: 'Mar', amount: 5900 },
  { month: 'Avr', amount: 8500 },
  { month: 'Mai', amount: 9200 },
  { month: 'Juin', amount: 8700 },
  { month: 'Juil', amount: 7500 }
]

export default function Objectifs() {
  const { data: salesData, isLoading } = useSales()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('ventes')
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [previousMonthRevenue, setPreviousMonthRevenue] = useState(0)
  const [dailyStats, setDailyStats] = useState<any[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [useCustomPeriod, setUseCustomPeriod] = useState(false)
  
  // Calcul des ventes pour la période sélectionnée
  useEffect(() => {
    if (salesData && user) {
      let startPeriod: Date
      let endPeriod: Date
      const now = new Date()

      // Définir la période d'analyse
      if (useCustomPeriod && dateRange?.from && dateRange?.to) {
        startPeriod = dateRange.from
        endPeriod = dateRange.to
      } else {
        startPeriod = startOfMonth(now)
        endPeriod = endOfMonth(now)
      }

      // Récupérer les ventes pour la période actuelle
      const userSales = salesData.filter((sale: any) => {
        const saleDate = new Date(sale.saleDate)
        return (
          sale.userId === user.$id &&
          isWithinInterval(saleDate, { start: startPeriod, end: endPeriod })
        )
      })

      // Calculer le chiffre d'affaires de la période
      const revenue = userSales.reduce((acc: number, sale: any) => acc + sale.totalAmount, 0)
      setMonthlyRevenue(revenue)

      // Calculer le chiffre d'affaires du mois précédent (pour comparaison)
      const previousMonth = subMonths(now, 1)
      const prevMonthStart = startOfMonth(previousMonth)
      const prevMonthEnd = endOfMonth(previousMonth)

      const prevMonthSales = salesData.filter((sale: any) => {
        const saleDate = new Date(sale.saleDate)
        return (
          sale.userId === user.$id &&
          isWithinInterval(saleDate, { start: prevMonthStart, end: prevMonthEnd })
        )
      })

      const prevRevenue = prevMonthSales.reduce((acc: number, sale: any) => acc + sale.totalAmount, 0)
      setPreviousMonthRevenue(prevRevenue)

      // Préparer les données pour le graphique journalier
      const dailyData: {[key: string]: number} = {}
      userSales.forEach((sale: any) => {
        const day = format(new Date(sale.saleDate), 'dd/MM')
        dailyData[day] = (dailyData[day] || 0) + sale.totalAmount
      })

      setDailyStats(Object.entries(dailyData).map(([day, amount]) => ({ day, amount })))
    }
  }, [salesData, user, dateRange, useCustomPeriod])
  
  // Réinitialiser la plage de dates personnalisée
  const resetDateRange = () => {
    setDateRange(undefined)
    setUseCustomPeriod(false)
  }
  
  // Filtrer les objectifs par catégorie
  const filterObjectivesByCategory = (category: string) => {
    return demoObjectives.filter(obj => obj.category === category)
  }
  
  // Calculer le pourcentage de progression
  const calculateProgress = (current: number, target: number) => {
    const progress = (current / target) * 100
    return progress > 100 ? 100 : progress
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-semibold">Objectifs et Performance</h2>
        <div className="flex gap-2 items-center">
          <DatePickerWithRange
            date={dateRange}
            setDate={(range) => {
              setDateRange(range)
              if (range?.from && range?.to) {
                setUseCustomPeriod(true)
              }
            }}
            className="w-[250px]"
          />
          
          {useCustomPeriod && dateRange?.from && dateRange?.to && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={resetDateRange}
              title="Réinitialiser la période"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Résumé du mois en cours */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-20 rounded-full bg-blue-400" />
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800">
              {useCustomPeriod && dateRange?.from && dateRange?.to 
                ? 'Chiffre d\'affaires période sélectionnée' 
                : 'Chiffre d\'affaires du mois'}
            </CardTitle>
            <CardDescription className="text-blue-600">
              {useCustomPeriod && dateRange?.from && dateRange?.to 
                ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}` 
                : 'Mois en cours'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {isLoading ? '...' : formatCurrency(monthlyRevenue)}
            </div>
            <div className="flex items-center mt-2 text-sm">
              {!useCustomPeriod && (
                <>
                  {monthlyRevenue > previousMonthRevenue ? (
                    <>
                      <ArrowUpIcon className="h-4 w-4 mr-1 text-green-600" />
                      <span className="text-green-600 font-medium">
                        +{Math.round((monthlyRevenue / previousMonthRevenue - 1) * 100) || 0}%
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownIcon className="h-4 w-4 mr-1 text-red-600" />
                      <span className="text-red-600 font-medium">
                        {Math.round((1 - monthlyRevenue / previousMonthRevenue) * 100) || 0}%
                      </span>
                    </>
                  )}
                  <span className="text-gray-600 ml-1">vs mois précédent</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 col-span-2">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-20 rounded-full bg-amber-400" />
          <CardHeader className="pb-0">
            <CardTitle className="text-amber-800">
              {useCustomPeriod && dateRange?.from && dateRange?.to 
                ? 'Progression sur la période' 
                : 'Progression ce mois-ci'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats.length > 0 ? dailyStats : demoSalesHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={dailyStats.length > 0 ? "day" : "month"} />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value) => [`${formatCurrency(Number(value))}`, 'Ventes']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: '#f59e0b' }} 
                    activeDot={{ r: 5 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Onglets par catégorie d'objectifs */}
      <Tabs 
        defaultValue="ventes" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 w-full md:w-80">
          <TabsTrigger value="ventes">Ventes</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="produits">Produits</TabsTrigger>
        </TabsList>
        
        {['ventes', 'clients', 'produits'].map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {filterObjectivesByCategory(category).map((objective) => {
              const progress = calculateProgress(objective.current, objective.target)
              const progressColor = 
                progress < 50 ? 'bg-red-500' :
                progress < 75 ? 'bg-amber-500' :
                'bg-green-500'
                
              return (
                <Card key={objective.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{objective.title}</CardTitle>
                      <Badge variant={progress >= 100 ? 'default' : 'outline'}>
                        {progress >= 100 ? 'Atteint' : `${Math.round(progress)}%`}
                      </Badge>
                    </div>
                    <CardDescription>
                      Objectif: {objective.target} {objective.unit}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progression actuelle: {objective.current} {objective.unit}</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className={`h-2 ${progressColor}`} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Historique des performances */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des performances</CardTitle>
          <CardDescription>Évolution de vos ventes sur les 6 derniers mois</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demoSalesHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip
                formatter={(value) => [`${formatCurrency(Number(value))}`, 'Chiffre d\'affaires']}
              />
              <Legend />
              <Bar dataKey="amount" name="Chiffre d'affaires" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
