'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStores } from '@/hooks'
import { useAuth } from '@/providers/AuthProvider'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { DatePickerWithRange } from '@/components/ui/date-picker'
import { DateRange } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Types pour le planning
type ShiftType = 'matin' | 'aprèsmidi' | 'journée' | 'repos' | 'formation' | 'congés'

type ShiftInfo = {
  type: ShiftType
  heureDebut?: string
  heureFin?: string
  commentaire?: string
}

type Planning = {
  [date: string]: ShiftInfo
}

// Données de démo pour le planning
const demoPlanning: Planning = {
  '2025-07-24': { type: 'matin', heureDebut: '08:00', heureFin: '13:00' },
  '2025-07-25': { type: 'aprèsmidi', heureDebut: '13:00', heureFin: '20:00' },
  '2025-07-26': { type: 'journée', heureDebut: '08:00', heureFin: '20:00' },
  '2025-07-27': { type: 'repos' },
  '2025-07-28': { type: 'repos' },
  '2025-07-29': { type: 'formation', commentaire: 'Formation vente produits cosmétiques' },
  '2025-07-30': { type: 'matin', heureDebut: '08:00', heureFin: '13:00' },
  '2025-08-01': { type: 'aprèsmidi', heureDebut: '13:00', heureFin: '20:00' },
  '2025-08-02': { type: 'journée', heureDebut: '08:00', heureFin: '20:00' },
  '2025-08-03': { type: 'repos' },
  '2025-08-04': { type: 'congés', commentaire: 'Congés annuels' },
  '2025-08-05': { type: 'congés', commentaire: 'Congés annuels' },
  '2025-08-06': { type: 'congés', commentaire: 'Congés annuels' }
}

// Couleurs pour les différents types de shifts
const shiftColors: Record<ShiftType, string> = {
  'matin': 'bg-blue-100 text-blue-800 border-blue-200',
  'aprèsmidi': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'journée': 'bg-purple-100 text-purple-800 border-purple-200',
  'repos': 'bg-gray-100 text-gray-500 border-gray-200',
  'formation': 'bg-amber-100 text-amber-800 border-amber-200',
  'congés': 'bg-green-100 text-green-800 border-green-200'
}

export default function Planning() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedStore, setSelectedStore] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [viewMode, setViewMode] = useState<'month' | 'custom'>('month')
  const { data: stores, isLoading } = useStores()
  const { user } = useAuth()
  
  // Fonction pour passer au mois suivant
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }
  
  // Fonction pour revenir au mois précédent
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }
  
  // Réinitialiser la sélection personnalisée lors du changement de mois
  useEffect(() => {
    if (viewMode === 'month') {
      setDateRange(undefined)
    }
  }, [currentMonth, viewMode])
  
  // Mise à jour du mode d'affichage lors de la sélection d'une période personnalisée
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setViewMode('custom')
    }
  }, [dateRange])
  
  // Calculer les jours à afficher en fonction du mode
  const getDisplayDays = () => {
    if (viewMode === 'custom' && dateRange?.from && dateRange?.to) {
      return eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
    } else {
      return eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
    }
  }
  
  const days = getDisplayDays()
  const monthStart = days[0]
  const monthEnd = days[days.length - 1]
  
  // Formatage des dates
  const getPeriodTitle = () => {
    if (viewMode === 'custom' && dateRange?.from && dateRange?.to) {
      const startStr = format(dateRange.from, 'dd MMMM', { locale: fr })
      const endStr = format(dateRange.to, 'dd MMMM yyyy', { locale: fr })
      return `${startStr} - ${endStr}`
    } else {
      return format(currentMonth, 'MMMM yyyy', { locale: fr })
    }
  }
  
  const periodTitle = getPeriodTitle()
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-semibold">Planning</h2>
        
        <div className="flex gap-2 flex-wrap">
          {!isLoading && stores && (
            <Select
              value={selectedStore}
              onValueChange={setSelectedStore}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner une boutique" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les boutiques</SelectItem>
                {stores.map((store: any) => (
                  <SelectItem key={store.$id} value={store.$id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <DatePickerWithRange
            date={dateRange}
            setDate={(range) => {
              setDateRange(range)
              if (range?.from && range?.to) {
                setViewMode('custom')
              }
            }}
            className="w-[250px]"
          />
          
          {viewMode === 'custom' && dateRange?.from && dateRange?.to && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                setDateRange(undefined)
                setViewMode('month')
              }}
              title="Revenir à la vue mensuelle"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{periodTitle.charAt(0).toUpperCase() + periodTitle.slice(1)}</CardTitle>
            {viewMode === 'custom' && dateRange?.from && dateRange?.to && (
              <CardDescription>
                {Math.floor((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24) + 1)} jours
              </CardDescription>
            )}
          </div>
          {viewMode === 'month' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevMonth}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="sr-only">Mois précédent</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
              >
                <ChevronRightIcon className="h-4 w-4" />
                <span className="sr-only">Mois suivant</span>
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="font-semibold text-sm py-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {/* Jours vides avant le premier jour affiché */}
            {viewMode === 'month' && Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, index) => (
              <div key={`empty-${index}`} className="h-24 rounded-md border border-transparent"></div>
            ))}
            
            {/* Jours du mois */}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const shift = demoPlanning[dateStr]
              const isCurrentDay = isToday(day)
              const isInSelectedRange = viewMode === 'custom' && dateRange?.from && dateRange?.to && 
                isWithinInterval(day, { start: dateRange.from, end: dateRange.to })
              
              return (
                <div 
                  key={dateStr}
                  className={`h-24 rounded-md border ${
                    isCurrentDay ? 'border-primary ring-1 ring-primary' : 
                    isInSelectedRange ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  } p-1 relative`}
                >
                  <div className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isCurrentDay ? 'bg-primary text-white' : 'text-gray-500'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  {shift && (
                    <div className={`mt-6 p-1 rounded-md text-xs ${shiftColors[shift.type]} border`}>
                      <div className="font-medium">{shift.type}</div>
                      {(shift.heureDebut && shift.heureFin) && (
                        <div>{shift.heureDebut} - {shift.heureFin}</div>
                      )}
                      {shift.commentaire && (
                        <div className="truncate">{shift.commentaire}</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Légende</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(shiftColors).map(([type, colorClass]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${colorClass.split(' ')[0]}`}></div>
                <span className="text-sm capitalize">{type}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ce planning est affiché à titre informatif. Pour toute modification ou demande d'absence, 
              veuillez contacter votre responsable directement.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
