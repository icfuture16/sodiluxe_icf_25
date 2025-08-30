'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { FileEdit, CalendarClock, ClipboardList, CheckCircle, XCircle, HelpCircle } from './icons'
import { cn } from '@/lib/utils'
import { useStores } from '@/hooks/useStores'
import { useInventories, Inventory } from '@/hooks/useStock'

interface InventoriesListProps {
  storeId?: string
  onViewInventory?: (inventoryId: string) => void
}

export default function InventoriesList({ storeId, onViewInventory }: InventoriesListProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  
  const { data: stores = [] } = useStores()
  const { data: inventories = [], isLoading } = useInventories({
    storeId,
    status: statusFilter,
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString()
  })

  function getStatusBadge(status: Inventory['status']) {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Brouillon</Badge>
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Planifié</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En cours</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Terminé</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Annulé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function getStatusIcon(status: Inventory['status']) {
    switch (status) {
      case 'draft':
        return <FileEdit className="h-4 w-4 text-gray-500" />
      case 'scheduled':
        return <CalendarClock className="h-4 w-4 text-blue-500" />
      case 'in_progress':
        return <ClipboardList className="h-4 w-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />
    }
  }

  // Calcul du pourcentage de progression directement dans le rendu

  return (
    <div className="space-y-4">
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
            <SelectItem value="validated">Validé</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
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
          setStatusFilter(undefined)
          setStartDate(undefined)
          setEndDate(undefined)
        }}>
          Réinitialiser
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Magasin</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Progression</TableHead>
              <TableHead>Créé par</TableHead>
              <TableHead>Validé par</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Chargement des données...</TableCell>
              </TableRow>
            ) : !Array.isArray(inventories) || inventories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Aucun inventaire trouvé</TableCell>
              </TableRow>
            ) : (
              (inventories as Inventory[]).map((inventory) => (
                <TableRow key={inventory.id}>
                  <TableCell>{getStatusIcon(inventory.status)}</TableCell>
                  <TableCell>
                    {inventory.startDate ? new Date(inventory.startDate).toLocaleDateString() : new Date(inventory.scheduledDate).toLocaleDateString()}
                    {inventory.endDate && (
                      <div className="text-xs text-gray-500">
                        Fin: {new Date(inventory.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{inventory.storeName}</TableCell>
                  <TableCell>{getStatusBadge(inventory.status)}</TableCell>
                  <TableCell>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${Math.round((inventory.countedItems / inventory.totalItems) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs mt-1">{`${Math.round((inventory.countedItems / inventory.totalItems) * 100)}%`}</div>
                  </TableCell>
                  <TableCell>{inventory.createdBy}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewInventory ? onViewInventory(inventory.id) : router.push(`/inventaire/inventories/${inventory.id}`)}
                    >
                      Détails
                    </Button>
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