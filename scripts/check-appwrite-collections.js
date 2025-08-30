/**
 * Script pour vérifier les collections Appwrite existantes
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Databases } = require('node-appwrite');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Vérification des variables d'environnement requises
if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  console.error('Erreur: Variables d\'environnement manquantes.');
  console.error('Veuillez définir NEXT_PUBLIC_APPWRITE_ENDPOINT et NEXT_PUBLIC_APPWRITE_PROJECT_ID dans le fichier .env.local');
  process.exit(1);
}

// Demander la clé API si elle n'est pas définie
if (!process.env.APPWRITE_API_KEY) {
  console.error('Erreur: Variable d\'environnement APPWRITE_API_KEY manquante.');
  console.error('Veuillez définir APPWRITE_API_KEY dans le fichier .env.local ou en ligne de commande');
  console.error('Exemple: APPWRITE_API_KEY=votre-cle-api node scripts/check-appwrite-collections.js');
  process.exit(1);
}

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY); // Clé API avec permissions suffisantes

const databases = new Databases(client);

// ID de la base de données
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '68599714002eef233c16';

// Fonction principale
async function checkCollections() {
  try {
    console.log('Vérification de la base de données Appwrite...');
    console.log(`ID de la base de données: ${DATABASE_ID}`);
    
    // Vérifier si la base de données existe
    try {
      const database = await databases.get(DATABASE_ID);
      console.log(`✅ La base de données '${DATABASE_ID}' existe:`);
      console.log(`   - Nom: ${database.name}`);
      console.log(`   - Description: ${database.description || 'Aucune description'}`);
      
      // Lister les collections
      console.log('\nListe des collections:');
      const collections = await databases.listCollections(DATABASE_ID);
      
      if (collections.total === 0) {
        console.log('❌ Aucune collection trouvée. Exécutez le script create-appwrite-collections.js');
      } else {
        collections.collections.forEach(collection => {
          console.log(`✅ Collection '${collection.id}': ${collection.name}`);
        });
      }
      
    } catch (error) {
      if (error.code === 404) {
        console.log(`❌ La base de données '${DATABASE_ID}' n'existe pas. Exécutez le script create-database.js`);
      } else {
        console.error(`❌ Erreur lors de la vérification de la base de données:`, error);
        throw error;
      }
    }

    console.log('\n📋 Étapes de dépannage:');
    console.log('1. Vérifiez que la clé API a les permissions nécessaires');
    console.log('2. Vérifiez que les plateformes sont configurées dans la console Appwrite:');
    console.log('   - http://localhost:3000');
    console.log('   - https://votre-domaine-de-production.com');
    console.log('3. Vérifiez que le DATABASE_ID est le même dans client.ts et .env.local');
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
checkCollections();