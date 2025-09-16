import { createServerClient } from '@/lib/appwrite/server';
import { DATABASE_ID, STORES_COLLECTION_ID } from '@/lib/appwrite-constants';
import { Query } from 'appwrite';

export interface Store {
  $id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  $createdAt: string;
  $updatedAt: string;
}

/**
 * Récupère tous les magasins actifs côté serveur
 * Cette fonction garantit des données déterministes pour l'hydratation
 */
export async function getStores(): Promise<Store[]> {
  try {
    const { databases } = createServerClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      STORES_COLLECTION_ID,
      [
        Query.equal('isActive', true),
        Query.orderAsc('name')
      ]
    );
    
    return response.documents.map(doc => ({
      $id: doc.$id,
      name: doc.name as string,
      address: doc.address as string | undefined,
      phone: doc.phone as string | undefined,
      email: doc.email as string | undefined,
      isActive: doc.isActive as boolean,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des magasins:', error);
    return [];
  }
}

