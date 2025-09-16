import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { useErrorHandler } from './useErrorHandler'

// Type pour les vendeurs à importer si nécessaire
type Seller = {
  $id: string
  $createdAt: string
  $updatedAt: string
  name: string
  storeId: string
  email: string
  phone?: string
  isActive: boolean
}

export function useSellers(storeId?: string) {
  const handleError = useErrorHandler()

  return useQuery({
    queryKey: ['sellers', storeId],
    queryFn: async () => {
      try {
        const queries = [Query.orderDesc('$createdAt')]

        if (storeId) {
          queries.push(Query.equal('storeId', storeId))
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USERS,
          queries
        )

        // Cast les documents en type Seller après vérification des propriétés
        return response.documents.map(doc => ({
          $id: doc.$id,
          $createdAt: doc.$createdAt,
          $updatedAt: doc.$updatedAt,
          name: doc.name,
          storeId: doc.storeId,
          email: doc.email,
          phone: doc.phone,
          isActive: doc.isActive
        })) as Seller[]
      } catch (error) {
        handleError(error, 'Impossible de récupérer les vendeurs')
        throw error
      }
    }
  })
}

