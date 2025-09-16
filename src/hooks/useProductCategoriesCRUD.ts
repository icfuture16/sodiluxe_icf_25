import { useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { ID } from 'appwrite'

// Catégories CRUD
export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCT_CATEGORIES,
        ID.unique(),
        { name }
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string, name: string }) => {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCT_CATEGORIES,
        id,
        { name }
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCT_CATEGORIES,
        id
      )
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] })
    },
  })
}

