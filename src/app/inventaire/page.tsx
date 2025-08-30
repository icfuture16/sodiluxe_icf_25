'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import StockLevelsList from '@/components/inventaire/StockLevelsList'
import StockMovementsList from '@/components/inventaire/StockMovementsList'
import InventoriesList from '@/components/inventaire/InventoriesList'
import StockAlertsList from '@/components/inventaire/StockAlertsList'
import StockAnalyticsDashboard from '@/components/inventaire/StockAnalyticsDashboard'
import NewStockMovementModal from '@/components/inventaire/NewStockMovementModal'
import NewInventoryModal from '@/components/inventaire/NewInventoryModal'
import InventoryDetailModal from '@/components/inventaire/InventoryDetailModal'
// import { useStores } from '@/hooks/useStores'

export default function InventairePage() {
  const [isNewMovementModalOpen, setIsNewMovementModalOpen] = useState(false)
  const [isNewInventoryModalOpen, setIsNewInventoryModalOpen] = useState(false)
  const [isInventoryDetailModalOpen, setIsInventoryDetailModalOpen] = useState(false)
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | undefined>()
  // Utilisation de selectedStoreId pour les filtres
  const [selectedStoreId] = useState<string | undefined>()
  // Stores sera utilisé dans une future implémentation de sélecteur de magasin
  // const { data: stores } = useStores()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Stocks</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsNewMovementModalOpen(true)}
            className="flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau Mouvement
          </Button>
          <Button
            onClick={() => setIsNewInventoryModalOpen(true)}
            variant="outline"
            className="flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvel Inventaire
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord des stocks</CardTitle>
          <CardDescription>
            Vue d&apos;ensemble de l&apos;état des stocks et des indicateurs clés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockAnalyticsDashboard storeId={selectedStoreId} />
        </CardContent>
      </Card>

      <Tabs defaultValue="stock-levels">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="stock-levels">Niveaux de Stock</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
          <TabsTrigger value="inventories">Inventaires</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="stock-levels">
          <Card>
            <CardHeader>
              <CardTitle>Niveaux de Stock</CardTitle>
              <CardDescription>
                Consultez les niveaux de stock actuels par produit et par magasin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockLevelsList storeId={selectedStoreId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Mouvements de Stock</CardTitle>
              <CardDescription>
                Historique des entrées, sorties et transferts de stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockMovementsList storeId={selectedStoreId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventories">
          <Card>
            <CardHeader>
              <CardTitle>Inventaires Physiques</CardTitle>
              <CardDescription>
                Planifiez et suivez les inventaires physiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoriesList 
                storeId={selectedStoreId} 
                onViewInventory={(inventoryId) => {
                  setSelectedInventoryId(inventoryId);
                  setIsInventoryDetailModalOpen(true);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Stock</CardTitle>
              <CardDescription>
                Notifications de ruptures, stocks faibles et autres alertes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockAlertsList storeId={selectedStoreId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NewStockMovementModal
        isOpen={isNewMovementModalOpen}
        onClose={() => setIsNewMovementModalOpen(false)}
      />

      <NewInventoryModal
        isOpen={isNewInventoryModalOpen}
        onClose={() => setIsNewInventoryModalOpen(false)}
      />

      {selectedInventoryId && (
        <InventoryDetailModal
          isOpen={isInventoryDetailModalOpen}
          onClose={() => setIsInventoryDetailModalOpen(false)}
          inventoryId={selectedInventoryId}
        />
      )}
    </div>
  )
}