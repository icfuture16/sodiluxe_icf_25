'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useStores } from '@/hooks/useStores'
import { useStockLevels, StockLevel } from '@/hooks/useStock'

interface StockLevelsListProps {
  storeId?: string
}

export default function StockLevelsList({ storeId }: StockLevelsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>()
  const [stockStatusFilter, setStockStatusFilter] = useState<string | undefined>()
  const { data: stores } = useStores()
  const { data: stockLevels, isLoading } = useStockLevels(storeId, categoryFilter)

  const filteredStock = stockLevels?.filter(item => {
    // Filter by search query
    if (searchQuery && !item.productName.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.productSku?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Filter by stock status
    if (stockStatusFilter) {
      const status = getStockStatus(item)
      if (status !== stockStatusFilter) {
        return false
      }
    }

    return true
  })

  function getStockStatus(stock: StockLevel) {
    if (stock.quantity <= 0) return 'out'
    if (stock.quantity <= stock.minQuantity) return 'low'
    if (stock.quantity >= stock.maxQuantity) return 'excess'
    return 'normal'
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'out':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rupture</Badge>
      case 'low':
        return <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200"><AlertTriangle className="h-3 w-3" /> Faible</Badge>
      case 'excess':
        return <Badge variant="secondary" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Excès</Badge>
      case 'normal':
        return <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3" /> Normal</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par nom ou référence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
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

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes catégories</SelectItem>
              <SelectItem value="horlogerie">Horlogerie</SelectItem>
              <SelectItem value="maroquinerie">Maroquinerie</SelectItem>
              <SelectItem value="accessoires">Accessoires</SelectItem>
              <SelectItem value="bagagerie">Bagagerie</SelectItem>
              <SelectItem value="joaillerie">Joaillerie</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les statuts</SelectItem>
              <SelectItem value="out">Rupture</SelectItem>
              <SelectItem value="low">Stock faible</SelectItem>
              <SelectItem value="normal">Stock normal</SelectItem>
              <SelectItem value="excess">Surstock</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => {
            setSearchQuery('')
            setCategoryFilter(undefined)
            setStockStatusFilter(undefined)
          }}>
            Réinitialiser
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead className="text-right">Réservé</TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Dernier mouvement</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">Chargement des données...</TableCell>
              </TableRow>
            ) : filteredStock?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">Aucun produit trouvé</TableCell>
              </TableRow>
            ) : (
              filteredStock?.map((item) => {
                const status = getStockStatus(item)
                return (
                  <TableRow key={`${item.productId}-${item.storeId}`}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.productSku}</TableCell>
                    <TableCell>{item.categoryName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">0</TableCell>
                    <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                    <TableCell>{getStatusBadge(status)}</TableCell>
                    <TableCell>{new Date(item.lastUpdated).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Détails</Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}