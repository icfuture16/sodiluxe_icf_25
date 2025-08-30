/**
 * Script pour rechercher un ID dans toutes les collections
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { DATABASE_ID, PROJECT_ID, ENDPOINT, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function findIdInCollections(searchId) {
  console.log(`🔍 Recherche de l'ID ${searchId} dans toutes les collections...\n`);
  
  // Liste de toutes les collections à vérifier
  const collectionsToCheck = [
    { name: 'users', id: COLLECTIONS.USERS },
    { name: 'sales', id: COLLECTIONS.SALES },
    { name: 'stores', id: COLLECTIONS.STORES },
    { name: 'products', id: COLLECTIONS.PRODUCTS }
  ];
  
  for (const collection of collectionsToCheck) {
    try {
      console.log(`📂 Vérification de la collection ${collection.name} (${collection.id})...`);
      
      // Essayer de récupérer le document directement
      try {
        const document = await databases.getDocument(DATABASE_ID, collection.id, searchId);
        console.log(`✅ TROUVÉ dans ${collection.name}:`);
        console.log(`   ID: ${document.$id}`);
        console.log(`   Données:`, JSON.stringify(document, null, 2));
        console.log('');
        return { collection: collection.name, document };
      } catch (getError) {
        if (getError.message.includes('could not be found')) {
          console.log(`   ❌ Non trouvé dans ${collection.name}`);
        } else {
          console.log(`   ⚠️  Erreur dans ${collection.name}:`, getError.message);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur d'accès à la collection ${collection.name}:`, error.message);
    }
  }
  
  console.log(`\n❌ L'ID ${searchId} n'a été trouvé dans aucune collection.`);
  return null;
}

// Rechercher l'ID problématique
const searchId = '688987f7003216df6426';
findIdInCollections(searchId);