import { NextResponse } from 'next/server';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/client';
import { ID } from 'appwrite';

// Configuration pour l'export statique avec Netlify
export const dynamic = "force-static";
export const revalidate = 0; // Ne pas mettre en cache

export async function GET() {
  try {

    // Vérifier si la collection existe déjà
    let collectionExists = false;
    try {
      await databases.listDocuments(DATABASE_ID, COLLECTIONS.DEBIT_SALES, []);
      collectionExists = true;
    } catch (error: any) {
      if (error?.code === 404) {
        collectionExists = false;
      } else {
        throw error;
      }
    }

    if (collectionExists) {
      return NextResponse.json({ 
        success: true, 
        message: 'La collection ventes débitrices existe déjà.',
        status: 'exists'
      });
    }

    // Informations sur la structure de collection attendue
    const collectionInfo = {
      id: COLLECTIONS.DEBIT_SALES,
      name: 'Ventes Débitrices',
      attributes: [
        { key: 'storeId', type: 'string', required: true },
        { key: 'clientId', type: 'string', required: true },
        { key: 'sellerId', type: 'string', required: true },
        // La date est gérée par l'attribut système $createdAt, pas besoin de champ 'date' personnalisé.
        { key: 'amount', type: 'number', required: true },
        { key: 'amountDue', type: 'number', required: true },
        { key: 'status', type: 'string', required: true },
        { key: 'dueDate', type: 'string', required: true },
        { key: 'notes', type: 'string', required: false }
      ]
    };

    return NextResponse.json({ 
      success: true,
      message: 'Pour créer la collection manuellement via Appwrite Console :',
      instructions: `
        1. Accédez à la console Appwrite et sélectionnez votre projet
        2. Naviguez vers "Databases" > "${DATABASE_ID}" > "Create Collection"
        3. Entrez "${collectionInfo.name}" comme nom et "${collectionInfo.id}" comme ID
        4. Configurez les permissions :
           - Read: any
           - Create/Update/Delete: team:admins
        5. Créez les attributs suivants :
           ${JSON.stringify(collectionInfo.attributes, null, 2)}
      `,
      collectionInfo
    });
  } catch (error: any) {
    console.error('Erreur lors de la vérification/création de collection:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Une erreur est survenue',
      code: error.code || 500
    }, { status: 500 });
  }
}
