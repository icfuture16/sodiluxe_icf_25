// Script pour ajouter un code d'accès à la collection access_codes

require('dotenv').config({ path: './scripts/.env' });
const { Client, Databases, ID, Query } = require('node-appwrite');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// ID de la base de données et de la collection
const DATABASE_ID = '68599714002eef233c16'; // ID de la base de données 'crm_sodiluxe'
const COLLECTIONS = {
  ACCESS_CODES: 'access_codes'
};

// Code d'accès à ajouter
const ACCESS_CODE = '123456'; // À modifier selon vos besoins

async function addAccessCode() {
  try {
    console.log('Vérification de la collection access_codes...');
    
    // Vérifier si la collection existe
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.ACCESS_CODES);
      console.log('Collection access_codes trouvée.');
    } catch (error) {
      if (error.code === 404) {
        console.log('La collection access_codes n\'existe pas. Création de la collection...');
        
        // Créer la collection
        await databases.createCollection(
          DATABASE_ID,
          COLLECTIONS.ACCESS_CODES,
          'Codes d\'accès',
          [
            'read("any")',
            'create("team:admin")',
            'update("team:admin")',
            'delete("team:admin")'
          ]
        );
        
        // Ajouter l'attribut code
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTIONS.ACCESS_CODES,
          'code',
          255,
          true,
          null,
          false
        );
        
        console.log('Collection access_codes créée avec succès.');
      } else {
        throw error;
      }
    }
    
    // Vérifier si le code d'accès existe déjà
    const existingCodes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ACCESS_CODES,
      [Query.equal('code', ACCESS_CODE)]
    );
    
    if (existingCodes.documents.length > 0) {
      console.log(`Le code d'accès ${ACCESS_CODE} existe déjà.`);
      return;
    }
    
    // Ajouter le code d'accès
    const result = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.ACCESS_CODES,
      ID.unique(),
      { code: ACCESS_CODE }
    );
    
    console.log(`Code d'accès ${ACCESS_CODE} ajouté avec succès.`);
    console.log(`ID du document: ${result.$id}`);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

addAccessCode();