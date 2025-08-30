'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Product } from "@/types/appwrite.types"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Card, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card'

// Schéma de validation
const productSchema = z.object({
  name: z.string().min(3, {
    message: "Le nom du produit doit contenir au moins 3 caractères"
  }),
  reference: z.string().min(1, {
    message: "La référence est requise"
  }),
  description: z.string().optional(),
  price: z.coerce.number().positive({
    message: "Le prix doit être positif"
  }),
  category: z.string().optional(),
  stockQuantity: z.coerce.number().nonnegative({
    message: "Le stock ne peut pas être négatif"
  }),
  lowStockThreshold: z.coerce.number().nonnegative({
    message: "Le seuil de stock bas ne peut pas être négatif"
  }),
  storeId: z.string().optional(),
})

interface ProductFormValues extends z.infer<typeof productSchema> {
  $id?: string;
}

interface ProductFormProps {
  categories: { id: string; name: string }[]
  stores?: { id: string; name: string }[]
  onSubmit: (data: ProductFormValues) => Promise<void>
  isLoading: boolean
  product?: Product | null
  isEditMode?: boolean
}

export default function ProductForm({ 
  categories, 
  stores = [], 
  onSubmit,
  isLoading,
  product,
  isEditMode = false
}: ProductFormProps) {
  // Génération automatique de la référence
  const generateReference = (category: string = '') => {
    const date = new Date();
    const year = date.getFullYear().toString().substring(2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    let categoryPrefix = '';
    if (category) {
      categoryPrefix = category.substring(0, 2).toUpperCase();
    }
    return `${categoryPrefix}-${year}${month}-${randomDigits}`;
  };

  const defaultValues = product && isEditMode
    ? {
        name: product.name || '',
        reference: product.reference || '',
        description: product.description || '',
        price: product.price || 0,
        category: product.category || '',
        stockQuantity: product.stockQuantity || 0,
        lowStockThreshold: product.lowStockThreshold || 5,
        storeId: product.storeId,
      }
    : {
        name: '',
        reference: '',
        description: '',
        price: 0,
        category: '',
        stockQuantity: 0,
        lowStockThreshold: 5,
        storeId: stores.length > 0 ? stores[0].id : undefined,
      };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues
  })

  // Mise à jour automatique de la référence en création
  useEffect(() => {
    if (!isEditMode) {
      const category = form.watch('category');
      if (category) {
        const generatedRef = generateReference(category);
        form.setValue('reference', generatedRef);
      }
    }
  }, [form.watch('category'), isEditMode]);

  const handleSubmit = async (data: ProductFormValues) => {
    try {
      if (isEditMode && product) {
        await onSubmit({ ...data, $id: product.$id })
        toast.success('Produit mis à jour avec succès')
      } else {
        await onSubmit(data)
        form.reset()
        toast.success('Produit ajouté avec succès')
      }
    } catch (error) {
      console.error('Erreur lors de l\'opération sur le produit:', error)
      toast.error(`Erreur lors de ${isEditMode ? 'la mise à jour' : 'l\'ajout'} du produit`)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 bg-white bg-opacity-100">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations produit */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="font-medium text-lg">Informations produit</h3>
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Référence *</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-généré" {...field} disabled={!isEditMode} className={!isEditMode ? "bg-gray-50" : ""} />
                      </FormControl>
                      {!isEditMode && (
                        <p className="text-xs text-muted-foreground mt-1">
                          La référence est générée automatiquement à partir de la catégorie
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du produit *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du produit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Description du produit" className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Classification */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Classification</h3>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[100]" style={{zIndex: 100}}>
                          {categories && categories.length > 0 ? (
                            categories.map((category, index) => {
                              // Gérer les deux formats : string ou objet {id, name}
                              const categoryName = typeof category === 'string' ? category : category.name;
                              const categoryValue = typeof category === 'string' ? category : category.name;
                              const categoryId = typeof category === 'string' ? category : category.id;
                              // Générer une clé unique en combinant l'index et l'ID/nom de la catégorie
                              const categoryKey = `category-${index}-${categoryId || categoryName}`;
                              
                              if (!categoryName || categoryName.trim() === '') return null;
                              
                              return (
                                <SelectItem key={categoryKey} value={categoryValue}>
                                  {categoryName}
                                </SelectItem>
                              );
                            })
                          ) : (
                            <SelectItem value="" disabled>
                              Aucune catégorie disponible
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Prix et stock */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Prix et stock</h3>
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix (F CFA) *</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={0.01} placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantité en stock *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seuil de stock bas</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Réinitialiser
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
                  {isEditMode ? 'Mise à jour en cours...' : 'Ajout en cours...'}
                </>
              ) : (
                isEditMode ? 'Mettre à jour le produit' : 'Ajouter le produit'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}