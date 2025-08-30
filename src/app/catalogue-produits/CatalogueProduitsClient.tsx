'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/formatters'
import { Product as BaseProduct } from "@/types/appwrite.types"
import { PermissionCheck } from '@/components/ui/permission-check'


import { useCatalogueProducts, useProductCategories, useCreateProduct, useUpdateProduct } from '@/hooks/useCatalogueProducts'
import ProductForm from '@/components/products/ProductForm'
import ProductDetails from '@/components/products/ProductDetails'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Search, Filter, Plus, Edit, X } from 'lucide-react'

interface ProductCategory {
  id: string
  name: string
}

interface Product extends BaseProduct {
  isBrandOnly?: boolean
}

function isBrandOnly(product: any): boolean {
  return Boolean(product && typeof product === 'object' && 'isBrandOnly' in product && product.isBrandOnly);
}


import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useProductCategoriesCRUD'

export default function CatalogueProduitsClient() {
  // États
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showNewProductForm, setShowNewProductForm] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Modale catégorie uniquement
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editCategory, setEditCategory] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("");

  // Effet pour s'assurer que nous sommes côté client
  useEffect(() => {
    setIsClient(true)
    // Délai pour permettre la synchronisation avec le serveur
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Requêtes et mutations catégories
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()
  const { data, isLoading: isLoadingProducts, refetch } = useCatalogueProducts({
    query: searchQuery || undefined,
    category: selectedCategory || undefined,
    status: selectedStatus as "active" | "inactive" | "discontinued" | "low_stock" | undefined
  })
  
  // Extraire les données
  const products = data?.products || []
  const totalProducts = data?.totalProducts || 0
  const lowStockProducts = data?.lowStockProducts || 0
  const outOfStockProducts = data?.outOfStockProducts || 0
  const totalValue = data?.totalValue || 0
  
  const categoriesData = useProductCategories()
  // Convertir les catégories en format attendu (id, name)
  const categoriesArray = categoriesData.data?.categories || []
  const categories: ProductCategory[] = categoriesArray
  .filter(cat => typeof cat === 'string' && cat.trim() !== '')
  .map((cat, index) => ({
    id: `cat_${index}_${cat.replace(/\s+/g, '_')}`, // Générer un ID unique
    name: cat
  }))
  
  
  const createProductMutation = useCreateProduct()
  const updateProductMutation = useUpdateProduct()
  
  const isAddingProduct = createProductMutation.isPending
  const isUpdatingProduct = updateProductMutation.isPending
  
  // Fonction pour gérer l'ajout ou la mise à jour d'un produit
  const handleAddProduct = async (productData: any) => {
    try {
      if (isEditMode && selectedProduct) {
        // Mode édition
        await updateProductMutation.mutateAsync({
          id: selectedProduct.$id,
          data: productData
        })
        toast.success("Produit mis à jour avec succès")
        setIsEditMode(false)
        setSelectedProduct(null)
        setShowNewProductForm(false)
      } else {
        // Mode création
        await createProductMutation.mutateAsync(productData)
        toast.success("Produit ajouté avec succès")
        setShowNewProductForm(false)
      }
      // Rafraîchir la liste
      refetch()
    } catch (error) {
      console.error("Erreur lors de l'opération sur le produit:", error)
      toast.error(`Erreur lors de ${isEditMode ? 'la mise à jour' : "l'ajout"} du produit`)
    }
  }

  // Fermer les modales
  const closeModals = () => {
    setSelectedProduct(null)
    setIsEditMode(false)
    setShowNewProductForm(false)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-2">Catalogue produits</h2>
            <p className="text-lg text-slate-600">Gérez votre inventaire avec style et efficacité</p>
          </div>
          <Button 
            onClick={() => setShowNewProductForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" /> Nouveau produit
          </Button>
        </div>
      
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-purple-600 transition-colors">Total produits</CardTitle>
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {isClient ? products.length : 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Produits disponibles</p>
            </CardContent>
          </Card>
          
          <PermissionCheck requiredRole="admin">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-purple-600 transition-colors">Valeur totale</CardTitle>
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                  <Plus className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {isClient ? formatCurrency(products.reduce((acc: number, product: Product) => acc + product.price, 0)) : formatCurrency(0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Valeur de l'inventaire</p>
              </CardContent>
            </Card>
          </PermissionCheck>
        </div>
      
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-slate-800">Liste des produits</CardTitle>
            <CardDescription className="text-slate-600">
              Gérez tous les produits du catalogue avec facilité
            </CardDescription>
          {/* Section dédiée aux catégories avec style amélioré */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4 border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-600" />
                Catégories disponibles
              </h3>
              <Button 
                className="h-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                size="sm"
                onClick={() => setShowCategoryModal(true)}
              >
                <Plus className="mr-1 h-3 w-3" /> Nouvelle catégorie
              </Button>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {!isClient ? (
                // Rendu initial côté serveur - affichage neutre
                <div className="text-sm text-slate-500 italic bg-white/50 rounded-lg px-3 py-2 border border-dashed border-slate-300">
                  Chargement des catégories...
                </div>
              ) : categories.length > 0 ? (
                categories.map(cat => (
                  <div key={cat.id} className="group relative">
                    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                      {editCategory === cat.name ? (
                        <Input
                          autoFocus
                          defaultValue={cat.name}
                          onBlur={async (e) => {
                            const val = e.target.value.trim();
                            if (val && val !== cat.name) {
                              try {
                                await updateCategoryMutation.mutateAsync({ id: cat.id, name: val });
                                toast.success('Catégorie modifiée');
                              } catch (e) {
                                toast.error('Erreur lors de la modification');
                              }
                            }
                            setEditCategory(null);
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val && val !== cat.name) {
                                try {
                                  await updateCategoryMutation.mutateAsync({ id: cat.id, name: val });
                                  toast.success('Catégorie modifiée');
                                } catch (e) {
                                  toast.error('Erreur lors de la modification');
                                }
                              }
                              setEditCategory(null);
                            } else if (e.key === 'Escape') {
                              setEditCategory(null);
                            }
                          }}
                          className="w-32 h-6 text-xs border-purple-300 focus:border-purple-500"
                        />
                      ) : (
                        <>
                          <span className="text-sm font-medium text-slate-700 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {cat.name}
                          </span>
                          <div className="flex gap-1 opacity-100 transition-opacity duration-200">
                            <button 
                              className="p-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors" 
                              onClick={() => setEditCategory(cat.name)}
                              title="Éditer la catégorie"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors" 
                              onClick={async () => {
                                if (window.confirm('Supprimer cette catégorie ?')) {
                                  try {
                                    await deleteCategoryMutation.mutateAsync(cat.id)
                                    toast.success('Catégorie supprimée')
                                  } catch (e) {
                                    toast.error('Erreur lors de la suppression')
                                  }
                                }
                              }}
                              title="Supprimer la catégorie"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500 italic bg-white/50 rounded-lg px-3 py-2 border border-dashed border-slate-300">
                  Aucune catégorie disponible. Créez votre première catégorie !
                </div>
              )}
            </div>
          </div>
          
          {/* Barre de recherche */}
          <div className="flex justify-between items-center gap-4 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un produit..."
                className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200 focus:border-purple-400 focus:ring-purple-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(isLoadingProducts || isInitialLoad) ? (
            <div className="flex justify-center p-4">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-800"></div>
            </div>
          ) : products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left">Référence</th>
                    <th className="pb-2 text-left">Nom</th>
                    <th className="pb-2 text-left">Catégorie</th>
                    <th className="pb-2 text-left">Prix</th>
                    <th className="pb-2 text-left">Stock</th>
                    <th className="pb-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products && products.map((product: Product) => (
                    <tr key={product.$id} className="border-b">
                      <td className="py-2">{product.reference || '-'}</td>
                      <td className="py-2">{product.name || '-'}</td>
                      <td className="py-2">{(product.category || '-') + (product.subcategory ? ` / ${product.subcategory}` : '')}</td>
                      
                      <td className="py-2">{formatCurrency(product.price ?? 0)}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${
                            product.stockQuantity === 0 ? 'text-red-600' : 
                            product.stockQuantity <= (product.lowStockThreshold || 5) ? 'text-red-600' : 
                            'text-green-600'
                          }`}>
                            {product.stockQuantity ?? 0}
                          </span>
                          {product.stockQuantity === 0 ? (
                            <Badge variant="destructive" className="text-xs px-1 py-0">Rupture</Badge>
                          ) : product.stockQuantity <= (product.lowStockThreshold || 5) ? (
                            <Badge variant="secondary" className="text-xs px-1 py-0 bg-red-100 text-red-700">Faible</Badge>
                          ) : (
                            <Badge variant="default" className="text-xs px-1 py-0 bg-green-100 text-green-700">En stock</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedProduct(product)}
                          >
                            Détails
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsEditMode(true);
                              setShowNewProductForm(true);
                            }}
                          >
                            Éditer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex justify-center p-4 text-gray-500">
              Aucun produit ne correspond aux filtres
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de détails du produit */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct && !showNewProductForm} onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}>
          <DialogContent className="sm:max-w-[650px] bg-white border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Détails du produit</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Informations complètes sur le produit
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-sm font-medium">Référence</div>
                <div className="col-span-3">{selectedProduct?.reference || '-'}</div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-sm font-medium">Nom</div>
                <div className="col-span-3">{selectedProduct?.name || '-'}</div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-sm font-medium">Description</div>
                <div className="col-span-3">{selectedProduct?.description || '-'}</div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-sm font-medium">Catégorie</div>
                <div className="col-span-3">
                  <Badge variant="outline">{selectedProduct?.category || '-'}</Badge>
                  {selectedProduct.subcategory && (
                    <Badge variant="outline" className="ml-2">{selectedProduct?.subcategory || ''}</Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-sm font-medium">Prix</div>
                <div className="col-span-3 font-semibold">{formatCurrency(selectedProduct?.price ?? 0)}</div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-sm font-medium">Stock</div>
                <div className="col-span-3">
                  <span className={`font-semibold ${selectedProduct.stockQuantity === 0 ? 'text-red-600' : 
                    selectedProduct.stockQuantity <= (selectedProduct.lowStockThreshold || 5) ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedProduct?.stockQuantity ?? 0}
                  </span>
                  {selectedProduct.stockQuantity === 0 ? (
                    <Badge variant="destructive" className="ml-2">Rupture de stock</Badge>
                  ) : selectedProduct.stockQuantity <= (selectedProduct.lowStockThreshold || 5) ? (
                    <Badge variant="warning" className="ml-2">Stock faible</Badge>
                  ) : (
                    <Badge variant="default" className="ml-2">En stock</Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-sm font-medium">Statut</div>
                <div className="col-span-3">
                  <Badge 
                    variant={
                      selectedProduct.status === 'active' ? 'default' : 
                      selectedProduct.status === 'inactive' ? 'secondary' : 
                      'destructive'
                    }
                  >
                    {
                      selectedProduct.status === 'active' ? 'Actif' :
                      selectedProduct.status === 'inactive' ? 'Inactif' :
                      'Discontinué'
                    }
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
  <Button variant="outline" onClick={() => setSelectedProduct(null)}>
    Fermer
  </Button>
  <Button onClick={() => {
    setIsEditMode(true);
    setShowNewProductForm(true);
  }}>
    Éditer
  </Button>
</div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Modal de création/édition de produit */}
      <Dialog open={showNewProductForm} onOpenChange={closeModals}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" style={{zIndex: 50}}>

          <div className="sr-only">
            <DialogTitle>{isEditMode ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Mettez à jour les informations du produit.' : 'Remplissez les champs pour créer un nouveau produit.'}
            </DialogDescription>
          </div>
          <ProductForm 
            categories={categories}
            onSubmit={handleAddProduct}
            isLoading={isAddingProduct || isUpdatingProduct}
            product={selectedProduct}
            isEditMode={isEditMode}
          />
        </DialogContent>
      </Dialog>
    {showCategoryModal && (
  <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
    <DialogContent className="bg-white">
      <DialogHeader>
        <DialogTitle>Nouvelle catégorie</DialogTitle>
        <DialogDescription>
          Créer une nouvelle catégorie de produit
        </DialogDescription>
      </DialogHeader>
      <Input
        placeholder="Nom de la catégorie"
        value={newCategoryName}
        onChange={e => setNewCategoryName(e.target.value)}
        className="mt-4"
        autoFocus
      />
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
          Annuler
        </Button>
        <Button
          disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
          onClick={() => {
            if (!newCategoryName.trim()) return;
            createCategoryMutation.mutate(
              newCategoryName,
              {
                onSuccess: () => {
                  setShowCategoryModal(false);
                  setNewCategoryName("");
                  refetch();
                  toast("Catégorie créée avec succès");
                },
                onError: (error: any) => {
                  toast(error?.message || 'Erreur lors de la création');
                }
              }
            );
          }}
        >
          {createCategoryMutation.isPending ? 'Création...' : 'Créer'}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)}

      </div>
    </div>
  )
}
