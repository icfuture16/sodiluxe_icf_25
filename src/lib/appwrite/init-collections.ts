import { databases, DATABASE_ID, COLLECTIONS } from './client';
import { ID } from 'appwrite';

/**
 * Structure de la collection debit_sales
 * @description Définit les attributs et les permissions de la collection debit_sales
 */
export interface DebitSaleCollection {
  id: string;
  storeId: string;
  clientId: string;
  sellerId: string;
  date: string;
  amount: number;
  amountDue: number;
  status: 'en_cours' | 'en_retard' | 'terminé';
  dueDate: string;
  notes?: string;
}

/**
 * Type d'attribut pour une collection
 */
interface CollectionAttribute {
  key: string;
  type: 'string' | 'integer' | 'double' | 'boolean' | 'datetime';
  required?: boolean;
  size?: number;
  default?: any;
  array?: boolean;
}

/**
 * Vérifie si une collection existe déjà
 */
export const collectionExists = async (collectionId: string): Promise<boolean> => {
  try {
    // Essayer de lister les documents (avec limite=0) pour voir si la collection existe
    await databases.listDocuments(DATABASE_ID, collectionId, []);
    return true;
  } catch (error: any) {
    if (error?.code === 404) {
      return false;
    }
    // Pour les autres erreurs, on considère que la collection n'existe pas
    console.error("Erreur lors de la vérification de l'existence de la collection:", error);
    return false;
  }
};

/**
 * Fonction pour créer les collections nécessaires de manière sécurisée
 * Note: La création de collections via le SDK client est limitée aux environnements de développement
 * ou aux comptes avec les permissions appropriées. Pour la production, il est préférable
 * de créer les collections manuellement via la console Appwrite ou un script côté serveur.
 */
export const createDebitSalesCollections = async (): Promise<void> => {
  console.info('Vérification de la collection des ventes débitrices...');
  
  try {
    // Vérifier si les collections existent déjà
    const debitSalesExists = await collectionExists(COLLECTIONS.DEBIT_SALES);
    
    if (debitSalesExists) {
      console.info('La collection des ventes débitrices existe déjà.');
      return;
    }
    
    // En production, afficher un message d'erreur et des instructions
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.error(
        'La collection de ventes débitrices n\'existe pas en production. ' +
        'Veuillez contacter l\'administrateur pour créer les collections nécessaires.'
      );
      return;
    }
    
    // En développement, proposer d'utiliser l'API Appwrite pour créer les collections
    console.info(
      'Collection des ventes débitrices non trouvée. ' +
      'Pour créer cette collection, utilisez la console Appwrite ou un script côté serveur.'
    );
    
    console.info(`Informations pour création manuelle:
- Collection ID: ${COLLECTIONS.DEBIT_SALES}
- Nom: Ventes Débitrices
- Attributs nécessaires:
  - storeId (string, requis)
  - clientId (string, requis)
  - sellerId (string, requis)
  - date (string, requis)
  - amount (double, requis)
  - amountDue (double, requis)
  - status (string, requis)
  - dueDate (string, requis)
  - notes (string, optionnel)
`);
    
  } catch (error) {
    console.error('Erreur lors de la vérification/création des collections:', error);
  }
};

// Export par défaut
export default createDebitSalesCollections;

