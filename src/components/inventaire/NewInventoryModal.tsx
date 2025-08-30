'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { useStores } from '@/hooks/useStores'
import { useCreateInventory } from '@/hooks/useStock'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'

interface NewInventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type InventoryType = 'full' | 'partial' | 'cycle'

export default function NewInventoryModal({ isOpen, onClose, onSuccess }: NewInventoryModalProps) {
  const { toast } = useToast()
  const { data: stores } = useStores()
  const createInventory = useCreateInventory()

  const [formData, setFormData] = useState({
    name: '',
    storeId: '',
    inventoryType: 'full' as InventoryType,
    scheduledDate: new Date(),
    categories: [] as string[],
    notes: '',
    blockSales: false,
    blockMovements: true,
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
      name: '',
      storeId: '',
      inventoryType: 'full',
      scheduledDate: new Date(),
      categories: [],
      notes: '',
      blockSales: false,
      blockMovements: true,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Veuillez saisir un nom pour l\'inventaire')
      }

      if (!formData.storeId) {
        throw new Error('Veuillez sélectionner un magasin')
      }

      if (formData.inventoryType === 'partial' && formData.categories.length === 0) {
        throw new Error('Veuillez sélectionner au moins une catégorie pour un inventaire partiel')
      }

      await createInventory.mutateAsync({
        name: formData.name,
        storeId: formData.storeId,
        inventoryType: formData.inventoryType,
        scheduledDate: formData.scheduledDate,
        categories: formData.categories,
        notes: formData.notes,
        blockSales: formData.blockSales,
        blockMovements: formData.blockMovements,
      })

      toast({
        title: 'Inventaire créé',
        description: 'L\'inventaire a été programmé avec succès.',
      })

      resetForm()
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création de l\'inventaire.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Exemple de catégories (à remplacer par les données réelles)
  const categories = [
    { id: 'cat1', name: 'Électroménager' },
    { id: 'cat2', name: 'Téléviseurs' },
    { id: 'cat3', name: 'Téléphones' },
    { id: 'cat4', name: 'Ordinateurs' },
    { id: 'cat5', name: 'Accessoires' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nouvel inventaire</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l&apos;inventaire</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Inventaire annuel 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store">Magasin</Label>
              <Select 
                value={formData.storeId} 
                onValueChange={(value) => handleChange('storeId', value)}
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

            <div className="space-y-2">
              <Label htmlFor="inventoryType">Type d&apos;inventaire</Label>
              <Select 
                value={formData.inventoryType} 
                onValueChange={(value: InventoryType) => handleChange('inventoryType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Complet</SelectItem>
                  <SelectItem value="partial">Partiel (par catégories)</SelectItem>
                  <SelectItem value="cycle">Cyclique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Date prévue</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduledDate ? (
                      format(formData.scheduledDate, 'PPP', { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.scheduledDate}
                    onSelect={(date) => handleChange('scheduledDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {formData.inventoryType === 'partial' && (
            <div className="space-y-2">
              <Label>Catégories à inventorier</Label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`category-${category.id}`}
                      checked={formData.categories.includes(category.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleChange('categories', [...formData.categories, category.id])
                        } else {
                          handleChange('categories', formData.categories.filter(id => id !== category.id))
                        }
                      }}
                    />
                    <label 
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea 
              id="notes" 
              value={formData.notes} 
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Instructions ou informations complémentaires"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="blockMovements"
                checked={formData.blockMovements}
                onCheckedChange={(checked) => handleChange('blockMovements', !!checked)}
              />
              <label 
                htmlFor="blockMovements"
                className="text-sm font-medium leading-none"
              >
                Bloquer les mouvements de stock pendant l&apos;inventaire
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="blockSales"
                checked={formData.blockSales}
                onCheckedChange={(checked) => handleChange('blockSales', !!checked)}
              />
              <label 
                htmlFor="blockSales"
                className="text-sm font-medium leading-none"
              >
                Bloquer les ventes pendant l&apos;inventaire
              </label>
            </div>
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
              {isSubmitting ? 'Création...' : 'Créer l&apos;inventaire'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}