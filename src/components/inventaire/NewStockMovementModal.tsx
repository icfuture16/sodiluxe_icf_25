'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useStores } from '@/hooks/useStores'
import { useProducts } from '@/hooks/useProducts'
import { useCreateStockMovement } from '@/hooks/useStock'

interface NewStockMovementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type MovementType = 'entry' | 'exit' | 'transfer' | 'adjustment'

export default function NewStockMovementModal({ isOpen, onClose, onSuccess }: NewStockMovementModalProps) {
  const { toast } = useToast()
  const { data: stores } = useStores()
  const { data: products } = useProducts()
  const createStockMovement = useCreateStockMovement()

  const [formData, setFormData] = useState({
    productId: '',
    movementType: 'entry' as MovementType,
    quantity: 1,
    sourceStoreId: '',
    destinationStoreId: '',
    reason: '',
    notes: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      productId: '',
      movementType: 'entry',
      quantity: 1,
      sourceStoreId: '',
      destinationStoreId: '',
      reason: '',
      notes: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.productId) {
        throw new Error('Veuillez sélectionner un produit')
      }

      if (formData.quantity <= 0) {
        throw new Error('La quantité doit être supérieure à 0')
      }

      if (formData.movementType === 'entry' && !formData.destinationStoreId) {
        throw new Error('Veuillez sélectionner un magasin de destination')
      }

      if (formData.movementType === 'exit' && !formData.sourceStoreId) {
        throw new Error('Veuillez sélectionner un magasin source')
      }

      if (formData.movementType === 'transfer') {
        if (!formData.sourceStoreId) {
          throw new Error('Veuillez sélectionner un magasin source')
        }
        if (!formData.destinationStoreId) {
          throw new Error('Veuillez sélectionner un magasin de destination')
        }
        if (formData.sourceStoreId === formData.destinationStoreId) {
          throw new Error('Les magasins source et destination doivent être différents')
        }
      }

      if (!formData.reason) {
        throw new Error('Veuillez indiquer une raison pour ce mouvement')
      }

      await createStockMovement.mutateAsync({
        productId: formData.productId,
        movementType: formData.movementType,
        quantity: formData.quantity,
        sourceStoreId: formData.sourceStoreId || null,
        destinationStoreId: formData.destinationStoreId || null,
        reason: formData.reason,
        notes: formData.notes,
      })

      toast({
        title: 'Mouvement de stock créé',
        description: 'Le mouvement de stock a été enregistré avec succès.',
      })

      resetForm()
      onSuccess?.() 
      onClose()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création du mouvement de stock.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nouveau mouvement de stock</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Produit</Label>
              <Select 
                value={formData.productId} 
                onValueChange={(value) => handleChange('productId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map(product => (
                    <SelectItem key={product.$id} value={product.$id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="movementType">Type de mouvement</Label>
              <Select 
                value={formData.movementType} 
                onValueChange={(value: MovementType) => handleChange('movementType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entrée</SelectItem>
                  <SelectItem value="exit">Sortie</SelectItem>
                  <SelectItem value="transfer">Transfert</SelectItem>
                  <SelectItem value="adjustment">Ajustement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input 
                id="quantity" 
                type="number" 
                min="1"
                value={formData.quantity} 
                onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
              />
            </div>

            {(formData.movementType === 'exit' || formData.movementType === 'transfer') && (
              <div className="space-y-2">
                <Label htmlFor="sourceStore">Magasin source</Label>
                <Select 
                  value={formData.sourceStoreId} 
                  onValueChange={(value) => handleChange('sourceStoreId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un magasin" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores?.map(store => (
                      <SelectItem key={store.$id} value={store.$id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(formData.movementType === 'entry' || formData.movementType === 'transfer') && (
              <div className="space-y-2">
                <Label htmlFor="destinationStore">Magasin destination</Label>
                <Select 
                  value={formData.destinationStoreId} 
                  onValueChange={(value) => handleChange('destinationStoreId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un magasin" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores?.map(store => (
                      <SelectItem key={store.$id} value={store.$id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Raison</Label>
              <Select 
                value={formData.reason} 
                onValueChange={(value) => handleChange('reason', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une raison" />
                </SelectTrigger>
                <SelectContent>
                  {formData.movementType === 'entry' && (
                    <>
                      <SelectItem value="purchase">Achat</SelectItem>
                      <SelectItem value="return_from_customer">Retour client</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </>
                  )}
                  {formData.movementType === 'exit' && (
                    <>
                      <SelectItem value="sale">Vente</SelectItem>
                      <SelectItem value="return_to_supplier">Retour fournisseur</SelectItem>
                      <SelectItem value="damage">Produit endommagé</SelectItem>
                      <SelectItem value="loss">Perte</SelectItem>
                      <SelectItem value="sample">Échantillon</SelectItem>
                    </>
                  )}
                  {formData.movementType === 'transfer' && (
                    <>
                      <SelectItem value="rebalancing">Rééquilibrage</SelectItem>
                      <SelectItem value="store_request">Demande magasin</SelectItem>
                    </>
                  )}
                  {formData.movementType === 'adjustment' && (
                    <>
                      <SelectItem value="inventory">Inventaire</SelectItem>
                      <SelectItem value="correction">Correction</SelectItem>
                    </>
                  )}
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea 
              id="notes" 
              value={formData.notes} 
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Informations complémentaires sur ce mouvement de stock"
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}