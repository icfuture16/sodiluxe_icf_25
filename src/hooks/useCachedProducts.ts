import { useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { Product } from '@/types/appwrite.types'
import { useCachedQuery } from './useCachedQuery'

/**
 * Hook pour récupérer et gérer les produits avec gestion du cache et des notifications
 * @param query - Terme de recherche optionnel pour filtrer les produits
 * @param category - Catégorie optionnelle pour filtrer les produits
 * @returns Données des produits et état de la requête
 */
export function useCachedProducts(query?: string, category?: string) {
  return useCachedQuery<Product[]>({
    namespace: 'products',
    key: `${query || 'all'}-${category || 'all'}`,
    queryFn: async () => {
      try {
        const queries = [Query.orderAsc('name')]

        if (query) {
          queries.push(Query.search('name', query))
        }

        if (category) {
          queries.push(Query.equal('category', category))
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          queries
        )

        return response.documents as Product[]
      } catch (error: any) {
        if (error.code === 404) {
          console.error('Collection produits non trouvée:', error)
          throw new Error('La collection produits n\'existe pas')
        } else if (error.code === 401) {
          console.error('Erreur d\'authentification:', error)
          throw new Error('Vous n\'êtes pas autorisé à accéder aux produits')
        } else {
          console.error('Erreur lors du chargement des produits:', error)
          throw error
        }
      }
    },
    successMessage: 'Produits chargés avec succès',
    errorMessage: 'Erreur lors du chargement des produits',
    retryCount: 2,
    priority: 'medium',
  })
}

/**
 * Hook pour créer un nouveau produit avec gestion du cache
 * @returns Mutation pour créer un produit
 */
export function useCreateCachedProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newProduct: Omit<Product, '$id' | '$createdAt' | '$updatedAt'>) => {
      try {
        const data = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          'unique()',
          newProduct
        )

        return data as Product
      } catch (error: any) {
        if (error.code === 409) {
          console.error('Produit déjà existant:', error)
          throw new Error('Un produit avec ce nom existe déjà')
        } else {
          console.error('Erreur lors de la création du produit:', error)
          throw error
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Hook pour mettre à jour un produit existant avec gestion du cache
 * @returns Mutation pour mettre à jour un produit
 */
export function useUpdateCachedProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<Product, '$id' | '$createdAt' | '$updatedAt'>>
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
        if (error.code === 404) {
          console.error('Produit non trouvé:', error)
          throw new Error('Le produit demandé n\'existe pas')
        } else {
          console.error('Erreur lors de la mise à jour du produit:', error)
          throw error
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}