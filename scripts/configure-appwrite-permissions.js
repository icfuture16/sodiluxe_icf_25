// Script pour configurer automatiquement les permissions Appwrite
require('dotenv').config();
const { Client, Databases, Teams } = require('appwrite');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Définir manuellement les variables d'environnement
process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = '6856f8aa00281cb47665';
process.env.APPWRITE_API_KEY = 'c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0c0c9c3c0'; // Remplacer par votre clé API réelle

// Initialiser le client Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function configurePermissions() {
  console.log('Configuration des permissions Appwrite...');
  
  try {
    // Configuration des permissions pour chaque collection
    for (const [name, id] of Object.entries(COLLECTIONS)) {
      console.log(`Configuration des permissions pour la collection ${name}...`);
      
      // Définir les permissions pour la collection
      await databases.updateCollection(
        DATABASE_ID,
        id,
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
      
      console.log(`✅ Permissions configurées pour ${name}`);
    }
    
    console.log('✅ Configuration des permissions terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des permissions:', error);
  }
}

configurePermissions();