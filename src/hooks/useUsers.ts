import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { User } from '@/types/appwrite.types'
import { ID } from 'appwrite'
import { useErrorHandler } from './useErrorHandler'
import { useOffline } from '@/providers/OfflineProvider'

export function useUsers() {
  const handleError = useErrorHandler()
  // Mode hors ligne désactivé
  // const { isOffline } = useOffline()

  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        // Mode hors ligne désactivé - on ne vérifie plus si on est hors ligne

        const queries = [Query.orderAsc('fullName')]

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USERS,
          queries
        )

        return response.documents as User[]
      } catch (error) {
        handleError(error, 'Erreur lors de la récupération des utilisateurs')
        throw error
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export interface UserInput {
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'seller'
  storeId: string
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  const handleError = useErrorHandler()
  // Mode hors ligne désactivé
  // const { isOffline } = useOffline()

  return useMutation({
    mutationFn: async (newUser: UserInput) => {
      try {
        // Mode hors ligne désactivé - on ne vérifie plus si on est hors ligne

        const data = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          ID.unique(),
          newUser
        )

        return data as User
      } catch (error) {
        handleError(error, 'Erreur lors de la création de l\'utilisateur')
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const handleError = useErrorHandler()
  // Mode hors ligne désactivé
  // const { isOffline } = useOffline()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<UserInput>
    }) => {
      try {
        // Mode hors ligne désactivé - on ne vérifie plus si on est hors ligne

        const data = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          id,
          updates
        )

        return data as User
      } catch (error) {
        handleError(error, 'Erreur lors de la mise à jour de l\'utilisateur')
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  const handleError = useErrorHandler()
  // Mode hors ligne désactivé
  // const { isOffline } = useOffline()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        // Mode hors ligne désactivé - on ne vérifie plus si on est hors ligne

        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          id
        )

        return id
      } catch (error) {
        handleError(error, 'Erreur lors de la suppression de l\'utilisateur')
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}