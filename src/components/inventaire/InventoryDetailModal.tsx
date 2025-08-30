'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Inventory } from '@/hooks/useStock'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

interface InventoryDetailModalProps {
  isOpen: boolean
  onClose: () => void
  inventoryId: string
}

interface InventoryProduct {
  id: string
  productId: string
  productName: string
  productSku: string
  categoryId: string
  categoryName: string
  expectedQuantity: number
  countedQuantity: number | null
  discrepancy: number | null
  status: 'pending' | 'counted' | 'validated'
  notes: string | null
}

export default function InventoryDetailModal({ isOpen, onClose, inventoryId }: InventoryDetailModalProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('details')
  const [isLoading, setIsLoading] = useState(true)
  const [inventory, setInventory] = useState<Inventory | null>(null)
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadInventoryData = async () => {
      setIsLoading(true)
      try {
        // Simulation - À remplacer par un appel API réel
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // Données simulées pour l'inventaire
        const mockInventory: Inventory = {
          id: inventoryId,
          name: 'Inventaire annuel 2023',
          storeId: 'store1',
          storeName: 'Magasin Principal',
          inventoryType: 'full',
          status: 'in_progress',
          scheduledDate: '2023-11-15T00:00:00Z',
          startDate: '2023-11-15T08:00:00Z',
          endDate: null,
          categories: null,
          totalItems: 120,
          countedItems: 85,
          discrepancies: 4,
          notes: 'Inventaire annuel complet',
          createdBy: 'John Doe',
          createdAt: '2023-11-10T09:00:00Z',
          blockSales: true,
          blockMovements: true
        }
        
        // Données simulées pour les produits de l'inventaire
        const mockProducts: InventoryProduct[] = [
          {
            id: 'ip1',
            productId: 'p1',
            productName: 'Réfrigérateur Samsung',
            productSku: 'REF-SAM-001',
            categoryId: 'cat1',
            categoryName: 'Électroménager',
            expectedQuantity: 15,
            countedQuantity: 15,
            discrepancy: 0,
            status: 'validated',
            notes: null
          },
          {
            id: 'ip2',
            productId: 'p2',
            productName: 'TV LG 55"',
            productSku: 'TV-LG-55',
            categoryId: 'cat2',
            categoryName: 'Téléviseurs',
            expectedQuantity: 3,
            countedQuantity: 2,
            discrepancy: -1,
            status: 'counted',
            notes: 'Un modèle d\'exposition manquant'
          },
          {
            id: 'ip3',
            productId: 'p3',
            productName: 'iPhone 13',
            productSku: 'PHN-IPH-13',
            categoryId: 'cat3',
            categoryName: 'Téléphones',
            expectedQuantity: 0,
            countedQuantity: 1,
            discrepancy: 1,
            status: 'counted',
            notes: 'Trouvé un modèle non enregistré'
          },
          {
            id: 'ip4',
            productId: 'p4',
            productName: 'Climatiseur Midea',
            productSku: 'CLIM-MID-12',
            categoryId: 'cat1',
            categoryName: 'Électroménager',
            expectedQuantity: 25,
            countedQuantity: null,
            discrepancy: null,
            status: 'pending',
            notes: null
          },
        ]
        
        setInventory(mockInventory)
        setProducts(mockProducts)
      } catch (error) {
        console.error('Error loading inventory data:', error)
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données de l\'inventaire.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    if (isOpen && inventoryId) {
      loadInventoryData()
    }
  }, [isOpen, inventoryId, toast])

  const handleCountUpdate = (productId: string, countedQuantity: number) => {
    setProducts(prevProducts => 
      prevProducts.map(product => {
        if (product.id === productId) {
          const discrepancy = countedQuantity - product.expectedQuantity
          return {
            ...product,
            countedQuantity,
            discrepancy,
            status: 'counted'
          }
        }
        return product
      })
    )
  }

  // La fonction handleNotesUpdate sera implémentée dans une future mise à jour
  // lorsque la fonctionnalité de mise à jour des notes sera ajoutée à l'interface

  const handleValidateProduct = (productId: string) => {
    setProducts(prevProducts => 
      prevProducts.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            status: 'validated'
          }
        }
        return product
      })
    )
  }

  const handleFinishInventory = async () => {
    setIsSubmitting(true)
    try {
      // Vérifier si tous les produits ont été comptés
      const pendingProducts = products.filter(p => p.status === 'pending')
      if (pendingProducts.length > 0) {
        throw new Error(`Il reste ${pendingProducts.length} produits à compter.`)
      }

      // Simulation - À remplacer par un appel API réel
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: 'Inventaire terminé',
        description: 'L\'inventaire a été finalisé avec succès.',
      })
      
      onClose()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la finalisation de l\'inventaire.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Planifié</Badge>
      case 'in_progress':
        return <Badge variant="secondary" className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> En cours</Badge>
      case 'completed':
        return <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3" /> Terminé</Badge>
      case 'cancelled':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Annulé</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const renderProductStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">À compter</Badge>
      case 'counted':
        return <Badge variant="secondary">Compté</Badge>
      case 'validated':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Validé</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const renderDiscrepancyBadge = (discrepancy: number | null) => {
    if (discrepancy === null) return null
    if (discrepancy === 0) return <Badge variant="outline">0</Badge>
    if (discrepancy > 0) return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">+{discrepancy}</Badge>
    return <Badge variant="destructive">{discrepancy}</Badge>
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Chargement des données...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!inventory) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{inventory.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Magasin</Label>
                <div className="font-medium">{inventory.storeName}</div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Statut</Label>
                <div>{renderStatusBadge(inventory.status)}</div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Type d&apos;inventaire</Label>
                <div className="font-medium">
                  {inventory.inventoryType === 'full' && 'Complet'}
                  {inventory.inventoryType === 'partial' && 'Partiel'}
                  {inventory.inventoryType === 'cycle' && 'Cyclique'}
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Date planifiée</Label>
                <div className="font-medium">
                  {format(new Date(inventory.scheduledDate), 'PPP', { locale: fr })}
                </div>
              </div>
              
              {inventory.startDate && (
                <div>
                  <Label className="text-muted-foreground">Date de début</Label>
                  <div className="font-medium">
                    {format(new Date(inventory.startDate), 'PPP à HH:mm', { locale: fr })}
                  </div>
                </div>
              )}
              
              {inventory.endDate && (
                <div>
                  <Label className="text-muted-foreground">Date de fin</Label>
                  <div className="font-medium">
                    {format(new Date(inventory.endDate), 'PPP à HH:mm', { locale: fr })}
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-muted-foreground">Créé par</Label>
                <div className="font-medium">{inventory.createdBy}</div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Créé le</Label>
                <div className="font-medium">
                  {format(new Date(inventory.createdAt), 'PPP', { locale: fr })}
                </div>
              </div>
            </div>
            
            {inventory.notes && (
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <div className="font-medium">{inventory.notes}</div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{inventory.totalItems}</div>
                <div className="text-sm text-muted-foreground">Produits à compter</div>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{inventory.countedItems}</div>
                <div className="text-sm text-muted-foreground">Produits comptés</div>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{inventory.discrepancies}</div>
                <div className="text-sm text-muted-foreground">Écarts détectés</div>
              </div>
            </div>
            
            <div className="flex justify-between mt-4">
              <div>
                {inventory.blockSales && (
                  <Badge variant="outline" className="mr-2">Ventes bloquées</Badge>
                )}
                {inventory.blockMovements && (
                  <Badge variant="outline">Mouvements bloqués</Badge>
                )}
              </div>
              
              {inventory.status === 'in_progress' && (
                <Button 
                  onClick={handleFinishInventory} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Finalisation...' : 'Finaliser l&apos;inventaire'}
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="products" className="py-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Qté attendue</TableHead>
                    <TableHead className="text-right">Qté comptée</TableHead>
                    <TableHead className="text-center">Écart</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-sm text-muted-foreground">{product.productSku}</div>
                      </TableCell>
                      <TableCell>{product.categoryName}</TableCell>
                      <TableCell className="text-right">{product.expectedQuantity}</TableCell>
                      <TableCell className="text-right">
                        {product.status === 'pending' && inventory.status === 'in_progress' ? (
                          <Input 
                            type="number" 
                            min="0"
                            className="w-20 text-right"
                            placeholder="-"
                            onChange={(e) => handleCountUpdate(product.id, parseInt(e.target.value) || 0)}
                          />
                        ) : (
                          product.countedQuantity ?? '-'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderDiscrepancyBadge(product.discrepancy)}
                      </TableCell>
                      <TableCell>
                        {renderProductStatusBadge(product.status)}
                      </TableCell>
                      <TableCell>
                        {product.status === 'counted' && inventory.status === 'in_progress' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleValidateProduct(product.id)}
                          >
                            Valider
                          </Button>
                        )}
                        {product.status === 'pending' && inventory.status === 'in_progress' && (
                          <span className="text-sm text-muted-foreground">À compter</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}