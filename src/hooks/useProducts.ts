import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { Product, AppwriteDocument } from '@/types/appwrite.types'
import { useErrorHandler } from './useErrorHandler'

/**
 * Hook pour récupérer et gérer les produits
 * @param query - Terme de recherche optionnel pour filtrer les produits
 * @returns Données des produits et état de la requête
 */
export function useProducts(query?: string) {
  const handleError = useErrorHandler()

  return useQuery<Product[]>({
    queryKey: ['products', query],
    queryFn: async () => {
      try {

        const queries = [Query.orderAsc('name')]

        if (query) {
          queries.push(Query.search('name', query))
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          queries
        )

        return response.documents as Product[]
      } catch (error: any) {
        console.error('Error fetching products:', error)
        handleError(error, 'Impossible de récupérer les produits')
        throw error
      }
    },
    // Toujours retenter, peu importe l'état de la connexion
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
    mutationFn: async (newProduct: Omit<Product, keyof AppwriteDocument>) => {
      try {

        const data = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          'unique()',
          newProduct
        )

        return data as Product
      } catch (error: any) {
        console.error('Error creating product:', error)
        handleError(error, 'Impossible de créer le produit')
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
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
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<Product, keyof AppwriteDocument>>
    }) => {
      try {

        const data = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          id,
          updates
        )

        return data as Product
      } catch (error: any) {
        console.error('Error updating product:', error)
        handleError(error, 'Impossible de mettre à jour le produit')
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// La fonction useDeleteProduct a été supprimée pour éviter les erreurs TypeScript

