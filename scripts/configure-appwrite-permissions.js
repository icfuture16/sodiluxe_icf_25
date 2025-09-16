// Script pour configurer automatiquement les permissions Appwrite
require('dotenv').config();
const { Client, Databases, Teams } = require('appwrite');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Définir manuellement les variables d'environnement
process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = '68bf1c29001d20f7444d';
process.env.APPWRITE_API_KEY = 'standard_7c860836bcc01137b6f2bac843cb0996bdb7d67d58e613ee92b26122296b0b7b42da7bbee2748b0b15c86f672a56e59ef5ebc21946625940759df6dc5396d43d0fb84c7535b3789f0ff54bc125305d06936ea9cbefec68dd0714dac4889fbeb630687ad2873aea1050bec1140c600a89d14e6cdfdffc6203509b14de4d897ad3';

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

