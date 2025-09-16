import { useCachedQuery } from './useCachedQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StoreService } from '@/lib/appwrite/storeService';
import { Store } from '@/types/appwrite.types';
import { useErrorHandler } from './useErrorHandler';

/**
 * Hook pour récupérer la liste des magasins avec gestion du cache
 * @returns Données des magasins et état de la requête
 */
export function useStores() {
  const handleError = useErrorHandler();

  return useCachedQuery<Store[]>({
    namespace: 'stores',
    key: 'all',
    queryFn: async () => {
      try {
        return await StoreService.getAllStores();
      } catch (error: any) {
        // Utiliser notre gestionnaire d'erreurs personnalisé
        handleError(error, 'Impossible de récupérer la liste des magasins');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ttl: 60 * 60 * 1000, // 1 heure
    // Toujours retenter, peu importe l'état de la connexion
    retry: (failureCount, error) => {
      return failureCount < 3;
    },
    // Message d'erreur personnalisé (sera utilisé par useCachedQuery)
    errorMessage: 'Impossible de récupérer la liste des magasins',
  });
}

/**
 * Hook pour créer un nouveau magasin
 * @returns Mutation pour créer un magasin
 */
export function useCreateStore() {
  const queryClient = useQueryClient();
  const handleError = useErrorHandler();

  return useMutation({
    mutationFn: async (storeData: Omit<Store, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>) => {
      try {
        return await StoreService.createStore(storeData);
      } catch (error: any) {
        handleError(error, 'Erreur lors de la création du magasin');
        throw error;
      }
    },
    onSuccess: () => {
      // Invalider le cache pour recharger les données
      queryClient.invalidateQueries({ queryKey: ['stores', 'all'] });
    },
  });
}

/**
 * Hook pour mettre à jour un magasin existant
 * @returns Mutation pour mettre à jour un magasin
 */
export function useUpdateStore() {
  const queryClient = useQueryClient();
  const handleError = useErrorHandler();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Omit<Store, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>> }) => {
      try {
        return await StoreService.updateStore(id, data);
      } catch (error: any) {
        handleError(error, 'Erreur lors de la mise à jour du magasin');
        throw error;
      }
    },
    onSuccess: () => {
      // Invalider le cache pour recharger les données
      queryClient.invalidateQueries({ queryKey: ['stores', 'all'] });
    },
  });
}

/**
 * Hook pour supprimer un magasin
 * @returns Mutation pour supprimer un magasin
 */
export function useDeleteStore() {
  const queryClient = useQueryClient();
  const handleError = useErrorHandler();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await StoreService.deleteStore(id);
      } catch (error: any) {
        handleError(error, 'Erreur lors de la suppression du magasin');
        throw error;
      }
    },
    onSuccess: () => {
      // Invalider le cache pour recharger les données
      queryClient.invalidateQueries({ queryKey: ['stores', 'all'] });
    },
  });
}

