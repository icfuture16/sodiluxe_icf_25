/**
 * @deprecated Ce fichier est déprécié suite à l'unification des collections sales et debit_sales.
 * 
 * MIGRATION GUIDE:
 * - Utilisez `useCreditSales()` au lieu de `useDebitSales()`
 * - Utilisez `useSale(id)` au lieu de `useDebitSale(id)`
 * - Utilisez `useSales({ isCredit: true })` pour plus de flexibilité
 * 
 * Les nouvelles fonctions sont disponibles dans '@/hooks/useSales'
 * 
 * Ce fichier sera supprimé dans une version future.
 */

import { useQuery } from '@tanstack/react-query';
import { databases } from '@/lib/appwrite-client';
import { Query } from 'appwrite';
import type { DebitSale } from '@/types/appwrite.types';

// Hook pour récupérer les ventes débitrices avec filtrage
// @deprecated Utilisez useCreditSales() depuis '@/hooks/useSales' à la place
export const useDebitSales = (storeId?: string, clientId?: string) => {
  return useQuery({
    queryKey: ['debitSales', storeId, clientId],
    queryFn: async () => {
      const queries = [];
      
      if (storeId) {
        queries.push(Query.equal('storeId', storeId));
      }
      
      if (clientId) {
        queries.push(Query.equal('clientId', clientId));
      }
      
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_DEBIT_SALES_COLLECTION_ID!,
        [
          ...queries,
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      );
      
      // Enrichir les données avec les informations client/utilisateur/magasin
      const enrichedSales = await Promise.all(
        response.documents.map(async (sale: any) => {
          try {
            // Récupérer les informations du client
            let clientInfo = null;
            if (sale.clientId) {
              try {
                const clientResponse = await databases.getDocument(
                  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                  process.env.NEXT_PUBLIC_APPWRITE_CLIENTS_COLLECTION_ID!,
                  sale.clientId
                );
                clientInfo = clientResponse;
              } catch (error) {
                console.warn('Client non trouvé:', sale.clientId);
              }
            }
            
            // Récupérer les informations de l'utilisateur
            let userInfo = null;
            if (sale.userId) {
              try {
                const userResponse = await databases.getDocument(
                  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                  process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
                  sale.userId
                );
                userInfo = userResponse;
              } catch (error) {
                console.warn('Utilisateur non trouvé:', sale.userId);
              }
            }
            
            // Récupérer les informations du magasin
            let storeInfo = null;
            if (sale.storeId) {
              try {
                const storeResponse = await databases.getDocument(
                  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                  process.env.NEXT_PUBLIC_APPWRITE_STORES_COLLECTION_ID!,
                  sale.storeId
                );
                storeInfo = storeResponse;
              } catch (error) {
                console.warn('Magasin non trouvé:', sale.storeId);
              }
            }
            
            return {
              ...sale,
              client: clientInfo,
              user: userInfo,
              store: storeInfo
            } as DebitSale;
          } catch (error) {
            console.error('Erreur lors de l\'enrichissement de la vente débitrice:', error);
            return sale as DebitSale;
          }
        })
      );
      
      return enrichedSales;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook pour récupérer une vente débitrice spécifique
// @deprecated Utilisez useSale(id) depuis '@/hooks/useSales' à la place
export const useDebitSale = (saleId: string) => {
  return useQuery({
    queryKey: ['debitSale', saleId],
    queryFn: async () => {
      const response = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_DEBIT_SALES_COLLECTION_ID!,
        saleId
      );
      
      // Enrichir avec les informations client/utilisateur/magasin
      let clientInfo = null;
      if (response.clientId) {
        try {
          const clientResponse = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_CLIENTS_COLLECTION_ID!,
            response.clientId
          );
          clientInfo = clientResponse;
        } catch (error) {
          console.warn('Client non trouvé:', response.clientId);
        }
      }
      
      let userInfo = null;
      if (response.userId) {
        try {
          const userResponse = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
            response.userId
          );
          userInfo = userResponse;
        } catch (error) {
          console.warn('Utilisateur non trouvé:', response.userId);
        }
      }
      
      let storeInfo = null;
      if (response.storeId) {
        try {
          const storeResponse = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_STORES_COLLECTION_ID!,
            response.storeId
          );
          storeInfo = storeResponse;
        } catch (error) {
          console.warn('Magasin non trouvé:', response.storeId);
        }
      }
      
      return {
        ...response,
        client: clientInfo,
        user: userInfo,
        store: storeInfo
      } as DebitSale;
    },
    enabled: !!saleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook pour compter les ventes débitrices
// @deprecated Utilisez useSales({ isCredit: true }) et comptez les résultats à la place
export const useDebitSalesCount = (storeId?: string) => {
  return useQuery({
    queryKey: ['debitSalesCount', storeId],
    queryFn: async () => {
      const queries = [];
      
      if (storeId) {
        queries.push(Query.equal('storeId', storeId));
      }
      
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_DEBIT_SALES_COLLECTION_ID!,
        [
          ...queries,
          Query.limit(1) // On ne veut que le count
        ]
      );
      
      return response.total;
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Re-export du hook de création
export { useCreateDebitSale } from './useCreateDebitSale';

