import { useState } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/client';
import { useAuth } from './useAuth';
import { User } from '@/types/appwrite.types';

interface DebitSaleData {
  clientId: string;
  totalAmount: number;
  discountAmount?: number;
  status: string;
  saleDate: string;
  initialPayment?: number;
  remainingAmount: number;
  guarantorName?: string;
  guarantorContact?: string;
  guarantorRelation?: string;
  numberOfInstallments?: number;
  dueDate?: string;
  notes?: string;
}

// Interface manquante ajoutée
interface CreateDebitSaleParams {
  sale: DebitSaleData;
  items: any[]; // Vous pouvez typer plus précisément selon vos besoins
}

export const useCreateDebitSale = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modifier la fonction pour accepter cette structure
  const createDebitSale = async (params: CreateDebitSaleParams | DebitSaleData) => {
    // Vérifier si c'est la nouvelle structure ou l'ancienne
    const saleData = 'sale' in params ? params.sale : params;
    const items = 'items' in params ? params.items : [];
    
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Récupérer le profil utilisateur depuis la collection USERS pour obtenir le storeId
      let userProfile: User | null = null;
      let storeId = '';
      
      try {
        userProfile = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          user.$id
        ) as User;
        
        storeId = userProfile.storeId || '';
        
        if (!storeId) {
          throw new Error('Aucun magasin associé à cet utilisateur');
        }
      } catch (dbError) {
        console.error('Erreur lors de la récupération du profil utilisateur:', dbError);
        throw new Error('Impossible de récupérer les informations du vendeur');
      }

      // Générer user_seller avec fallback et troncature
      const sellerName = userProfile.fullName || user.name || 'Vendeur';
      const sellerEmail = userProfile.email || user.email || '';
      const user_seller = `${sellerName.substring(0, 4)}_${sellerEmail.substring(0, 4)}`.substring(0, 9);

      // Préparer les données pour Appwrite avec les bons noms d'attributs
      const debitSaleDocument = {
        storeId,
        clientId: saleData.clientId,
        user_seller, // Utiliser user_seller au lieu de sellerId
        date: saleData.saleDate, // Mapper saleDate vers date
        status: saleData.status,
        totalAmount: saleData.totalAmount,
        discountAmount: saleData.discountAmount || 0,
        initialPayment: saleData.initialPayment || 0,
        remainingAmount: saleData.remainingAmount,
        guarantorName: saleData.guarantorName || '',
        guarantorContact: saleData.guarantorContact || '',
        guarantorRelation: saleData.guarantorRelation || '',
        numberOfInstallments: saleData.numberOfInstallments || 1,
        dueDate: saleData.dueDate || '',
        notes: saleData.notes || '',
        userId: user.$id,
        isCredit: true // Marquer comme vente à crédit dans la collection unifiée
      };

      // Créer la vente à crédit dans la collection unifiée
      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SALES,
        'unique()',
        debitSaleDocument
      );

      console.log('Vente débitrice créée avec succès:', result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la vente débitrice';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Alias pour compatibilité avec React Query
  const mutateAsync = createDebitSale;

  return {
    createDebitSale,
    mutateAsync,
    isLoading,
    error
  };
};