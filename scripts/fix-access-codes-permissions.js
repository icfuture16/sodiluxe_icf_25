// Script pour configurer les permissions de la collection access_codes
require('dotenv').config();
const { Client, Databases } = require('appwrite');

// Définir manuellement les variables d'environnement
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68bf1c29001d20f7444d';
const APPWRITE_API_KEY = 'standard_7c860836bcc01137b6f2bac843cb0996bdb7d67d58e613ee92b26122296b0b7b42da7bbee2748b0b15c86f672a56e59ef5ebc21946625940759df6dc5396d43d0fb84c7535b3789f0ff54bc125305d06936ea9cbefec68dd0714dac4889fbeb630687ad2873aea1050bec1140c600a89d14e6cdfdffc6203509b14de4d897ad3';
const DATABASE_ID = '68bf1e7b003c6b340d6e';
const ACCESS_CODES_COLLECTION = 'access_codes';

// Initialiser le client Appwrite
const client = new Client();
client.setEndpoint(APPWRITE_ENDPOINT);
client.setProject(APPWRITE_PROJECT_ID);
client.setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

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

