'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { useGroupedNotifications } from '@/hooks/useGroupedNotifications'

import { Product } from '@/types/appwrite.types'
import LoadingState from '@/components/ui/LoadingState'
import ErrorState from '@/components/ui/ErrorState'
import { BsSearch, BsPlus, BsPencil, BsTrash } from 'react-icons/bs'

// Définition de l'interface pour les données du formulaire de produit
interface ProductFormData {
  name: string
  description: string
  price: number
  category: string
  stockQuantity: number

}

// Définition des catégories disponibles
const CATEGORIES = [
  { id: 'all', name: 'Toutes les catégories' },
  { id: 'electronics', name: 'Électronique' },
  { id: 'clothing', name: 'Vêtements' },
  { id: 'food', name: 'Alimentation' },
  { id: 'beauty', name: 'Beauté' },
  { id: 'other', name: 'Autres' },
]

/**
 * Exemple de composant utilisant les hooks optimisés pour gérer une liste de produits
 */
export default function ProductListExample() {
  // État local pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Utilisation des hooks optimisés
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const { showGroupedNotification: showNotification } = useGroupedNotifications()
  const handleError = useErrorHandler()
  
  // Simulons les hooks que nous avons créés
  // Dans une implémentation réelle, nous utiliserions useOptimisticProducts
  const { 
    data: products, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useSimulatedProductsQuery(debouncedSearchTerm, selectedCategory, currentPage, pageSize)
  
  const createProduct = useSimulatedCreateProduct()
  const updateProduct = useSimulatedUpdateProduct()
  const deleteProduct = useSimulatedDeleteProduct()
  
  // Gestion des erreurs
  useEffect(() => {
    if (isError && error) {
      handleError(error, 'Erreur lors du chargement des produits', refetch)
    }
  }, [isError, error, handleError, refetch])
  
  // Gestion de la soumission du formulaire
  const handleSubmit = (formData: ProductFormData) => {
    if (editingProduct) {
      // Mise à jour d'un produit existant
      updateProduct.mutate(
        {
          id: editingProduct.$id,
          updates: formData
        },
        {
          onSuccess: () => {
            showNotification('success', 'Produit mis à jour avec succès', 'product-update')
            setIsFormOpen(false)
            setEditingProduct(null)
          },
          onError: (error) => {
            handleError(error, 'Erreur lors de la mise à jour du produit')
          }
        }
      )
    } else {
      // Création d'un nouveau produit
      createProduct.mutate(formData, {
        onSuccess: () => {
          showNotification('success', 'Produit créé avec succès', 'product-create')
          setIsFormOpen(false)
        },
        onError: (error) => {
          handleError(error, 'Erreur lors de la création du produit')
        }
      })
    }
  }
  
  // Gestion de la suppression d'un produit
  const handleDelete = (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      deleteProduct.mutate(productId, {
        onSuccess: () => {
          showNotification('success', 'Produit supprimé avec succès', 'product-delete')
        },
        onError: (error) => {
          handleError(error, 'Erreur lors de la suppression du produit')
        }
      })
    }
  }
  
  // Affichage de l'état de chargement
  if (isLoading) {
    return <LoadingState />
  }
  
  // Affichage de l'état d'erreur
  if (isError && !products) {
    return (
      <ErrorState 
        message="Impossible de charger les produits" 
        retry={refetch} 
      />
    )
  }
  
  return (
    <div className="space-y-6">
      {/* En-tête avec titre et bouton d'ajout */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des produits</h1>
        <button
          onClick={() => {
            setEditingProduct(null)
            setIsFormOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <BsPlus className="h-5 w-5" />
          Ajouter un produit
        </button>
      </div>
      
      {/* Filtres et recherche */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <BsSearch className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-full sm:w-auto">
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Liste des produits */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité en stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products?.map((product) => (
              <tr key={product.$id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(product.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.stockQuantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setEditingProduct(product)
                        setIsFormOpen(true)
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <BsPencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.$id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <BsTrash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Affichage de {products ? Math.min((currentPage - 1) * pageSize + 1, products.length) : 0} à {products ? Math.min(currentPage * pageSize, products.length) : 0} sur {products?.length || 0} résultats
          </span>
          <select
            className="text-sm border border-gray-300 rounded-md p-1"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[5, 10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size} par page
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Précédent
          </button>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={!products || currentPage * pageSize >= products.length}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>
      
      {/* Formulaire de création/édition (simplifié) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
            </h2>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = {
                name: (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value,
                description: (e.currentTarget.elements.namedItem('description') as HTMLInputElement).value,
                price: Number((e.currentTarget.elements.namedItem('price') as HTMLInputElement).value),
                category: (e.currentTarget.elements.namedItem('category') as HTMLSelectElement).value,
                stockQuantity: Number((e.currentTarget.elements.namedItem('stockQuantity') as HTMLInputElement).value),
              }
              handleSubmit(formData)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProduct?.name || ''}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingProduct?.description || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prix</label>
                  <input
                    type="number"
                    name="price"
                    defaultValue={editingProduct?.price || ''}
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                  <select
                    name="category"
                    defaultValue={editingProduct?.category || 'other'}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantité en stock</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    defaultValue={editingProduct?.stockQuantity || 0}
                    required
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false)
                    setEditingProduct(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                  disabled={createProduct.isPending || updateProduct.isPending}
                >
                  {createProduct.isPending || updateProduct.isPending ? 'Chargement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Fonctions simulées pour l'exemple
// Dans une implémentation réelle, ces fonctions seraient remplacées par les hooks réels

function useSimulatedProductsQuery(search: string, category: string, page: number, pageSize: number) {
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<Product[] | null>(null)
  
  useEffect(() => {
    // Simuler un chargement
    setIsLoading(true)
    setIsError(false)
    setError(null)
    
    const timer = setTimeout(() => {
      try {
        // Simuler des données
        const mockProducts: Product[] = Array.from({ length: 25 }, (_, i) => ({
          $id: `product-${i + 1}`,
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString(),
          $permissions: [],
          $collectionId: 'products',
          $databaseId: 'database',
          name: `Produit ${i + 1}`,
          reference: `REF-${i + 100}`,
          description: `Description du produit ${i + 1}`,
          price: Math.floor(Math.random() * 10000) + 1000,
          category: CATEGORIES[Math.floor(Math.random() * (CATEGORIES.length - 1)) + 1].id,
          stockQuantity: Math.floor(Math.random() * 100),
          status: 'active' as const
        }))
        
        // Filtrer par recherche
        let filtered = mockProducts
        if (search) {
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase())
          )
        }
        
        // Filtrer par catégorie
        if (category !== 'all') {
          filtered = filtered.filter(p => p.category === category)
        }
        
        setData(filtered)
        setIsLoading(false)
      } catch (err) {
        setIsError(true)
        setError(err instanceof Error ? err : new Error('Une erreur est survenue'))
        setIsLoading(false)
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [search, category, page, pageSize])
  
  const refetch = () => {
    setIsLoading(true)
    setIsError(false)
    setError(null)
    
    setTimeout(() => {
      setIsLoading(false)
      setData(data)
    }, 1000)
  }
  
  return { data, isLoading, isError, error, refetch }
}

function useSimulatedCreateProduct() {
  const [isPending, setIsPending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const mutate = (data: ProductFormData, options?: { onSuccess?: () => void, onError?: (error: Error) => void }) => {
    setIsPending(true)
    setIsLoading(true)
    
    setTimeout(() => {
      setIsPending(false)
      setIsLoading(false)
      if (Math.random() > 0.1) { // 90% de chance de succès
        options?.onSuccess?.();
      } else {
        options?.onError?.(new Error('Erreur simulée lors de la création du produit'));
      }
    }, 1000);
  };
  
  return { mutate, isPending, isLoading };
}

function useSimulatedUpdateProduct() {
  const [isPending, setIsPending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const mutate = (
    data: { id: string, updates: Partial<ProductFormData> },
    options?: { onSuccess?: () => void, onError?: (error: Error) => void }
  ) => {
    setIsPending(true)
    setIsLoading(true)
    
    setTimeout(() => {
      setIsPending(false)
      setIsLoading(false)
      if (Math.random() > 0.1) { // 90% de chance de succès
        options?.onSuccess?.();
      } else {
        options?.onError?.(new Error('Erreur simulée lors de la mise à jour du produit'));
      }
    }, 1000);
  };
  
  return { mutate, isPending, isLoading };
}

function useSimulatedDeleteProduct() {
  const [isPending, setIsPending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const mutate = (
    id: string,
    options?: { onSuccess?: () => void, onError?: (error: Error) => void }
  ) => {
    setIsPending(true)
    setIsLoading(true)
    
    setTimeout(() => {
      setIsPending(false)
      setIsLoading(false)
      if (Math.random() > 0.1) { // 90% de chance de succès
        options?.onSuccess?.();
      } else {
        options?.onError?.(new Error('Erreur simulée lors de la suppression du produit'));
      }
    }, 1000);
  };
  
  return { mutate, isPending, isLoading };
}