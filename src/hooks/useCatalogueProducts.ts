import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { Product } from '@/types/appwrite.types'
import { useErrorHandler } from './useErrorHandler'

/**
 * Hook amélioré pour récupérer et gérer les produits du catalogue
 * @param options - Options de filtrage pour les produits
 * @returns Données des produits et état de la requête
 */
export function useCatalogueProducts(options?: {
  query?: string;
  category?: string;
  status?: 'active' | 'inactive' | 'discontinued' | 'low_stock' | 'all';
  storeId?: string;
}) {
  const handleError = useErrorHandler()
  const { query, category, status, storeId } = options || {}

  return useQuery<{
    products: Product[];
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalValue: number;
  }>({
    queryKey: ['catalogueProducts', query, category, status, storeId],
    queryFn: async () => {
      try {
        const queries = [Query.orderAsc('name')]

        if (query) {
          queries.push(Query.search('name', query))
        }

        if (category && category !== 'all') {
          queries.push(Query.equal('category', category))
        }

        // Nous gérons le statut "low_stock" côté client après avoir récupéré les données
        if (status && status !== 'all' && status !== 'low_stock') {
          queries.push(Query.equal('status', status))
        }

        if (storeId) {
          queries.push(Query.equal('storeId', storeId))
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          queries
        )

        let products = response.documents as Product[]

        // Filtrer les produits à faible stock si ce filtre est sélectionné
        if (status === 'low_stock') {
          products = products.filter(product => 
            product.stockQuantity > 0 && 
            product.lowStockThreshold && 
            product.stockQuantity <= product.lowStockThreshold
          )
        }

        // Calculer les statistiques
        const lowStockProducts = products.filter(product => 
          product.stockQuantity > 0 && 
          product.lowStockThreshold && 
          product.stockQuantity <= product.lowStockThreshold
        ).length
        
        const outOfStockProducts = products.filter(product => product.stockQuantity === 0).length
        
        const totalValue = products.reduce((sum, product) => 
          sum + (product.price * product.stockQuantity), 0
        )

        return {
          products,
          totalProducts: products.length,
          lowStockProducts,
          outOfStockProducts,
          totalValue
        }
      } catch (error: any) {
        console.error('Error fetching catalogue products:', error)
        handleError(error, 'Impossible de récupérer les produits du catalogue')
        throw error
      }
    },
    retry: (failureCount, error) => {
      return failureCount < 3
    },
  })
}



/**
 * Hook pour récupérer toutes les catégories et marques disponibles
 */
export function useProductCategories() {
  const handleError = useErrorHandler()

  return useQuery<{
    categories: string[];
  }>({
    queryKey: ['productCategories'],
    queryFn: async () => {
      try {
        // Récupérer les catégories depuis la collection dédiée
        const categoriesResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PRODUCT_CATEGORIES,
          [Query.limit(100)]
        )
        // En cas d’absence de catégories, extraire les catégories uniques des produits
        let categories: string[] = []
        if (categoriesResponse.documents.length > 0) {
          categories = categoriesResponse.documents.map((cat: any) => cat.name)
        } else {
          const productsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            [Query.limit(100)]
          )
          const products = productsResponse.documents as Product[]
          categories = Array.from(new Set(products.map(product => product.category))).sort()
        }
        return { categories }
      } catch (error: any) {
        console.error('Error fetching product categories:', error)
        handleError(error, 'Impossible de récupérer les catégories')
        return { categories: [] }
      }
    },
    retry: (failureCount, error) => {
      return failureCount < 3
    },
  })
}

/**
 * Hook pour créer un nouveau produit
 * @returns Mutation pour créer un produit
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()
  const handleError = useErrorHandler()

  return useMutation({
    mutationFn: async (productData: Omit<Product, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>) => {
      try {
        // S'assurer que les valeurs requises sont présentes
        const data = {
          ...productData,
          stockQuantity: productData.stockQuantity || 0,
          status: productData.status || 'active',
        }

        const response = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          'unique()',
          data
        )

        return response
      } catch (error: any) {
        console.error('Error creating product:', error)
        handleError(error, 'Impossible de créer le produit')
        throw error
      }
    },
    onSuccess: () => {
      // Invalider toutes les requêtes liées aux produits pour forcer un rechargement
      queryClient.invalidateQueries({ queryKey: ['catalogueProducts'] })
      queryClient.invalidateQueries({ queryKey: ['productCategories'] })
    },
  })
}

/**
 * Hook pour mettre à jour un produit existant
 * @returns Mutation pour mettre à jour un produit
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  const handleError = useErrorHandler()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      try {
        const response = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          id,
          data
        )

        return response
      } catch (error: any) {
        console.error('Error updating product:', error)
        handleError(error, 'Impossible de mettre à jour le produit')
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogueProducts'] })
    },
  })
}

/**
 * Hook pour supprimer un produit
 * @returns Mutation pour supprimer un produit
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const handleError = useErrorHandler()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          id,
          { status: 'discontinued' }
        )

        return { success: true }
      } catch (error: any) {
        console.error('Error marking product as discontinued:', error)
        handleError(error, 'Impossible de supprimer le produit')
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogueProducts'] })
    },
  })
}

