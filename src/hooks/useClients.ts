import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { Client, ClientInput } from '@/types/client.types'

export function useClients(query?: string) {
  return useQuery<Client[]>({
    queryKey: ['clients', query],
    queryFn: async () => {
      try {
        // Si la requête est vide ou contient uniquement des espaces, retourner un tableau vide
        if (!query || query.trim() === '') {
          return [] as Client[]
        }
        
        const queries = [Query.orderAsc('fullName')]
        queries.push(Query.search('fullName', query))

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CLIENTS,
          queries
        )

        return response.documents as Client[]
      } catch (error) {
        console.error('Error fetching clients:', error)
        throw error
      }
    },
    // Ne pas exécuter la requête si la recherche est vide
    enabled: query ? query.trim().length > 0 : false,
  })
}

export function useAllClients() {
  return useQuery<Client[]>({
    queryKey: ['clients', 'all'],
    queryFn: async () => {
      try {
        const queries = [Query.orderAsc('fullName')]

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CLIENTS,
          queries
        )

        return response.documents as Client[]
      } catch (error) {
        console.error('Error fetching all clients:', error)
        throw error
      }
    },
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newClient: ClientInput) => {
      try {
        const data = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.CLIENTS,
          'unique()',
          newClient
        )

        return data as Client
      } catch (error) {
        console.error('Error creating client:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<ClientInput>
    }) => {
      try {
        const data = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.CLIENTS,
          id,
          updates
        )

        return data as Client
      } catch (error) {
        console.error('Error updating client:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
