import { databases, DATABASE_ID, COLLECTIONS } from './client';
import { ID, Query } from 'appwrite';
import { Store } from '@/types/appwrite.types';

/**
 * Service pour la gestion des boutiques
 */
export const StoreService = {
  /**
   * Récupère toutes les boutiques
   * @returns Liste des boutiques
   */
  async getAllStores(): Promise<Store[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STORES,
        [Query.orderAsc('name')]
      );
      return response.documents as Store[];
    } catch (error: any) {
      console.error('Erreur lors de la récupération des boutiques:', error);
      // Si la collection n'existe pas, retourner un tableau vide
      if (error.code === 404) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Récupère une boutique par son ID
   * @param id ID de la boutique
   * @returns Boutique trouvée ou null
   */
  async getStoreById(id: string): Promise<Store | null> {
    try {
      const store = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.STORES,
        id
      );
      return store as Store;
    } catch (error: any) {
      console.error(`Erreur lors de la récupération de la boutique ${id}:`, error);
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Crée une nouvelle boutique
   * @param storeData Données de la boutique
   * @returns Boutique créée
   */
  async createStore(storeData: Omit<Store, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>): Promise<Store> {
    try {
      // S'assurer que isActive est défini
      const dataWithDefaults = {
        ...storeData,
        isActive: storeData.isActive !== undefined ? storeData.isActive : true,
      };
      
      const store = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.STORES,
        ID.unique(),
        dataWithDefaults
      );
      return store as Store;
    } catch (error: any) {
      console.error('Erreur lors de la création de la boutique:', error);
      throw error;
    }
  },

  /**
   * Met à jour une boutique existante
   * @param id ID de la boutique
   * @param storeData Données à mettre à jour
   * @returns Boutique mise à jour
   */
  async updateStore(id: string, storeData: Partial<Omit<Store, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>>): Promise<Store> {
    try {
      const store = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.STORES,
        id,
        storeData
      );
      return store as Store;
    } catch (error: any) {
      console.error(`Erreur lors de la mise à jour de la boutique ${id}:`, error);
      throw error;
    }
  },

  /**
   * Supprime une boutique
   * @param id ID de la boutique
   * @returns true si la suppression a réussi
   */
  async deleteStore(id: string): Promise<boolean> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.STORES,
        id
      );
      return true;
    } catch (error: any) {
      console.error(`Erreur lors de la suppression de la boutique ${id}:`, error);
      
      // Si le document n'existe pas, on considère que la suppression est réussie
      if (error.code === 404) {
        console.warn(`La boutique ${id} n'existe pas ou a déjà été supprimée`);
        return true;
      }
      
      throw error;
    }
  }
};

