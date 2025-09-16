import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { ID } from 'appwrite'
import { Product } from '@/types/appwrite.types'
import { useNotification } from '@/components/feedback/NotificationSystem'

const COLLECTION_ID = COLLECTIONS.PRODUCTS

type ProductInput = Omit<Product, '$id' | '$createdAt' | '$updatedAt'>
type ProductUpdateInput = {
  id: string
  updates: Partial<Omit<Product, '$id' | '$createdAt' | '$updatedAt'>>
}

/**
 * Hook pour récupérer et gérer les produits avec mise en cache et pagination
 * Inclut des mises à jour optimistes pour une meilleure UX
 */
export function useOptimisticProducts({
  search = '',
  category = '',
  limit = 10,
  offset = 0
}: {
  search?: string
  category?: string
  limit?: number
  offset?: number
}) {
  // const queryClient = useQueryClient()

  // Construire les filtres pour la requête
  const filters: string[] = []
  if (search) {
    filters.push(`name.contains('${search}')`)
  }
  if (category) {
    filters.push(`category='${category}'`)
  }

  // Requête pour récupérer les produits
  return useQuery({
    queryKey: ['products', { search, category, limit, offset }],
    queryFn: async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [
            ...filters,
            Query.limit(limit),
            Query.offset(offset),
            Query.orderDesc('$createdAt')
          ]
        )
        return {
          documents: response.documents as Product[],
          total: response.total
        }
      } catch (error: any) {
        console.error('Error fetching products:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

/**
 * Hook pour créer un produit avec mise à jour optimiste
 */
export function useCreateOptimisticProduct() {
  const queryClient = useQueryClient()
  const { showNotification } = useNotification()

  return useMutation<Product, Error, ProductInput, { previousProducts: any }>({
    mutationFn: async (productData) => {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        productData
      )
      return response as Product
    },
    // Mise à jour optimiste
    onMutate: async (newProduct) => {
      // Annuler les requêtes en cours pour éviter d'écraser notre mise à jour optimiste
      await queryClient.cancelQueries({ queryKey: ['products'] })

      // Sauvegarder l'état précédent
      const previousProducts = queryClient.getQueryData(['products'])

      // Mettre à jour le cache avec le nouveau produit
      queryClient.setQueryData(['products'], (old: any) => {
        if (!old) return { documents: [], total: 0 }

        const optimisticProduct = {
          ...newProduct,
          $id: 'temp-id-' + Date.now(),
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString(),
          $permissions: [],
          $collectionId: COLLECTION_ID,
          $databaseId: DATABASE_ID
        }

        return {
          ...old,
          documents: [optimisticProduct, ...old.documents],
          total: old.total + 1
        }
      })

      return { previousProducts }
    },
    onError: (err, newProduct, context) => {
      // Restaurer l'état précédent en cas d'erreur
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts)
      }
      showNotification({ type: 'error', message: `Erreur lors de la création du produit: ${err.message}`, priority: 'high' })
    },
    onSuccess: () => {
      showNotification({ type: 'success', message: 'Produit créé avec succès', priority: 'medium' })
      // Invalider les requêtes pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

/**
 * Hook pour mettre à jour un produit avec mise à jour optimiste
 */
export function useUpdateOptimisticProduct() {
  const queryClient = useQueryClient()
  const { showNotification } = useNotification()

  return useMutation<Product, Error, ProductUpdateInput, { previousProducts: any }>({
    mutationFn: async ({ id, updates }) => {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id,
        updates
      )
      return response as Product
    },
    // Mise à jour optimiste
    onMutate: async ({ id, updates }) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ['products'] })

      // Sauvegarder l'état précédent
      const previousProducts = queryClient.getQueryData(['products'])

      // Mettre à jour le cache avec les modifications
      queryClient.setQueryData(['products'], (old: any) => {
        if (!old) return { documents: [], total: 0 }

        return {
          ...old,
          documents: old.documents.map((product: Product) =>
            product.$id === id
              ? { ...product, ...updates, $updatedAt: new Date().toISOString() }
              : product
          )
        }
      })

      return { previousProducts }
    },
    onError: (err, variables, context) => {
      // Restaurer l'état précédent en cas d'erreur
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts)
      }
      showNotification({ type: 'error', message: `Erreur lors de la mise à jour du produit: ${err.message}`, priority: 'high' })
    },
    onSuccess: () => {
      showNotification({ type: 'success', message: 'Produit mis à jour avec succès', priority: 'medium' })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

/**
 * Hook pour supprimer un produit avec mise à jour optimiste
 */
export function useDeleteOptimisticProduct() {
  const queryClient = useQueryClient()
  const { showNotification } = useNotification()

  return useMutation<string, Error, string, { previousProducts: any }>({
    mutationFn: async (id) => {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id
      )
      return id
    },
    // Mise à jour optimiste
    onMutate: async (id) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ['products'] })

      // Sauvegarder l'état précédent
      const previousProducts = queryClient.getQueryData(['products'])

      // Mettre à jour le cache en supprimant le produit
      queryClient.setQueryData(['products'], (old: any) => {
        if (!old) return { documents: [], total: 0 }

        return {
          ...old,
          documents: old.documents.filter((product: Product) => product.$id !== id),
          total: old.total - 1
        }
      })

      return { previousProducts }
    },
    onError: (err, _, context) => {
      // Restaurer l'état précédent en cas d'erreur
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts)
      }
      showNotification({ type: 'error', message: `Erreur lors de la suppression du produit: ${err.message}`, priority: 'high' })
    },
    onSuccess: () => {
      showNotification({ type: 'success', message: 'Produit supprimé avec succès', priority: 'medium' })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

