// Script pour vérifier la collection access_codes et ses permissions avec des valeurs codées en dur
const { Client, Databases } = require('appwrite');

// Valeurs codées en dur basées sur le fichier .env.local
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '6856f8aa00281cb47665';
const APPWRITE_API_KEY = 'c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0';
const DATABASE_ID = '68599714002eef233c16';
const ACCESS_CODES_COLLECTION = 'access_codes';

// Initialiser le client Appwrite
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkAccessCodesCollection() {
  console.log('Vérification de la collection access_codes...');
  
  try {
    // Vérifier si la collection existe
    const collection = await databases.getCollection(
      DATABASE_ID,
      ACCESS_CODES_COLLECTION
    );
    
    console.log('✅ Collection access_codes trouvée!');
    console.log('ID:', collection.$id);
    console.log('Nom:', collection.name);
    console.log('Permissions:', collection.$permissions);
    
    // Vérifier si les permissions sont correctement configurées
    const hasGuestReadPermission = collection.$permissions.some(
      permission => permission.includes('read("user:guest")')
    );
    
    const hasAuthenticatedPermissions = collection.$permissions.some(
      permission => permission.includes('read("user:authenticated")')
    );
    
    if (hasGuestReadPermission) {
      console.log('✅ Les invités ont la permission de lecture');
    } else {
      console.log('❌ Les invités n\'ont PAS la permission de lecture');
      console.log('Solution: Exécutez le script configure-appwrite-permissions.js pour configurer les permissions');
    }
    
    if (hasAuthenticatedPermissions) {
      console.log('✅ Les utilisateurs authentifiés ont les permissions nécessaires');
    } else {
      console.log('❌ Les utilisateurs authentifiés n\'ont PAS les permissions nécessaires');
      console.log('Solution: Exécutez le script configure-appwrite-permissions.js pour configurer les permissions');
    }
    
    // Vérifier si la collection contient des documents
    const documents = await databases.listDocuments(
      DATABASE_ID,
      ACCESS_CODES_COLLECTION
    );
    
    console.log(`✅ La collection contient ${documents.documents.length} codes d'accès`);
    
    if (documents.documents.length === 0) {
      console.log('⚠️ Aucun code d\'accès n\'est défini. Vous devriez en ajouter au moins un.');
    } else {
      console.log('Codes disponibles:');
      documents.documents.forEach(doc => {
        console.log(`- ${doc.code} (ID: ${doc.$id})`);
      });
    }
    
  } catch (error) {
    if (error.code === 404) {
      console.error('❌ La collection access_codes n\'existe pas!');
      console.log('Solution: Exécutez le script create-appwrite-collections.js pour créer les collections');
    } else {
      console.error('❌ Erreur lors de la vérification de la collection:', error);
    }
  }
}

checkAccessCodesCollection();