// Script pour configurer les permissions de la collection access_codes avec Appwrite v16
require('dotenv').config();
const sdk = require('appwrite');

// Définir manuellement les variables d'environnement
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '6856f8aa00281cb47665';
const APPWRITE_API_KEY = 'c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0'; // Remplacer par votre clé API réelle
const DATABASE_ID = '68599714002eef233c16';
const ACCESS_CODES_COLLECTION = 'access_codes';

// Initialiser le client Appwrite selon la documentation v16
const client = new sdk.Client();

// Configurer le client
client.setEndpoint(APPWRITE_ENDPOINT);
client.setProject(APPWRITE_PROJECT_ID);

// Pour l'API key, nous devons utiliser les headers directement dans v16
client.setHeaders({
  'X-Appwrite-Key': APPWRITE_API_KEY
});

const databases = new sdk.Databases(client);

async function configureAccessCodesPermissions() {
  console.log('Configuration des permissions pour la collection access_codes...');
  
  try {
    // Définir les permissions pour la collection access_codes
    await databases.updateCollection(
      DATABASE_ID,
      ACCESS_CODES_COLLECTION,
      undefined, // name (inchangé)
      undefined, // documentSecurity (inchangé)
      [
        // Permissions pour les utilisateurs authentifiés
        'create("user:authenticated")',
        'read("user:authenticated")',
        'update("user:authenticated")',
        'delete("user:authenticated")',
        
        // Permissions pour les invités (lecture seule)
        'read("user:guest")',
      ]
    );
    
    console.log('✅ Permissions configurées pour access_codes');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des permissions:', error);
  }
}

configureAccessCodesPermissions();