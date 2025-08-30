'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStores } from '@/hooks/useStores'
import { useStockMovements } from '@/hooks/useStock'

interface StockMovementsListProps {
  storeId?: string
}

export default function StockMovementsList({ storeId }: StockMovementsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [movementType, setMovementType] = useState<string | undefined>()
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  
  const { data: stores } = useStores()
  const { data: movements, isLoading } = useStockMovements({
    storeId,
    movementType,
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString()
  })

  const filteredMovements = movements?.filter(movement => {
    if (searchQuery && !movement.productName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  function getMovementTypeBadge(type: string) {
    switch (type) {
      case 'entry':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Entrée</Badge>
      case 'exit':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Sortie</Badge>
      case 'transfer':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Transfert</Badge>
      case 'adjustment':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Ajustement</Badge>
      case 'reservation':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Réservation</Badge>
      case 'reservation_cancel':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Annulation réservation</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  function getReferenceLabel(movement: any) {
    if (!movement.documentReference) return '-'
    
    // Utiliser documentReference qui est disponible dans l'interface StockMovement
    return movement.documentReference
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex flex-wrap gap-2">
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

          <Select value={movementType} onValueChange={setMovementType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les types</SelectItem>
              <SelectItem value="entry">Entrées</SelectItem>
              <SelectItem value="exit">Sorties</SelectItem>
              <SelectItem value="transfer">Transferts</SelectItem>
              <SelectItem value="adjustment">Ajustements</SelectItem>
              <SelectItem value="reservation">Réservations</SelectItem>
              <SelectItem value="reservation_cancel">Annulations</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'dd/MM/yyyy') : "Date début"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'dd/MM/yyyy') : "Date fin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={() => {
            setSearchQuery('')
            setMovementType(undefined)
            setStartDate(undefined)
            setEndDate(undefined)
          }}>
            Réinitialiser
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead>Magasin</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Chargement des données...</TableCell>
              </TableRow>
            ) : filteredMovements?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Aucun mouvement trouvé</TableCell>
              </TableRow>
            ) : (
              filteredMovements?.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {new Date(movement.createdAt).toLocaleDateString()}
                    <div className="text-xs text-gray-500">
                      {new Date(movement.createdAt).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{movement.productName}</TableCell>
                  <TableCell>{getMovementTypeBadge(movement.movementType)}</TableCell>
                  <TableCell className="text-right font-medium">{movement.quantity}</TableCell>
                  <TableCell>{movement.sourceStoreName || movement.destinationStoreName || '-'}</TableCell>
                  <TableCell>{getReferenceLabel(movement)}</TableCell>
                  <TableCell>{movement.createdBy}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Détails</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}