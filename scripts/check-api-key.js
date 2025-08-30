/**
 * Script pour vérifier si la clé API Appwrite est correctement configurée
 * Ce script teste si la clé API a les permissions nécessaires pour créer des bases de données et des collections
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

// Vérification de la clé API
if (!process.env.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY === 'your-api-key-here') {
  console.error('Erreur: Clé API Appwrite non configurée.');
  console.error('Veuillez définir APPWRITE_API_KEY dans le fichier .env.local avec une clé API valide.');
  console.error('Vous pouvez créer une clé API dans la console Appwrite:');
  console.error('1. Accédez à la console Appwrite > Project Settings > API Keys');
  console.error('2. Créez une nouvelle clé API avec les permissions suivantes:');
  console.error('   - databases.read');
  console.error('   - databases.write');
  console.error('   - collections.read');
  console.error('   - collections.write');
  console.error('   - documents.read');
  console.error('   - documents.write');
  process.exit(1);
}

// Configuration Appwrite (server-side, avec clé API)
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// ID de la base de données
const DATABASE_ID = '68599714002eef233c16'; // Utiliser l'ID de la base de données de client.ts

// Fonction pour vérifier les permissions de la clé API
async function checkApiKeyPermissions() {
  try {
    console.log('Vérification des permissions de la clé API Appwrite...');
    console.log(`Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);
    console.log(`Project ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);
    console.log(`Database ID: ${DATABASE_ID}`);
    
    // Tester si la clé API peut lister les bases de données
    console.log('\nTest de la permission databases.read...');
    try {
      const databasesList = await databases.list();
      console.log(`✅ La clé API a la permission databases.read`);
      console.log(`Nombre de bases de données: ${databasesList.total}`);
      
      // Vérifier si notre base de données existe
      const databaseExists = databasesList.databases.some(db => db.$id === DATABASE_ID);
      if (databaseExists) {
        console.log(`✅ La base de données avec l'ID ${DATABASE_ID} existe`);
      } else {
        console.log(`❌ La base de données avec l'ID ${DATABASE_ID} n'existe pas`);
        console.log('Vous devez créer la base de données en exécutant le script create-database.js');
      }
      
    } catch (error) {
      console.error(`❌ La clé API n'a pas la permission databases.read:`, error.message);
      console.log('Code d\'erreur:', error.code);
      console.log('Type d\'erreur:', error.type);
    }
    
    // Tester si la clé API peut lister les collections
    console.log('\nTest de la permission collections.read...');
    try {
      // On essaie de lister les collections, même si la base de données n'existe pas encore
      try {
        const collectionsList = await databases.listCollections(DATABASE_ID);
        console.log(`✅ La clé API a la permission collections.read`);
        console.log(`Nombre de collections: ${collectionsList.total}`);
        
        if (collectionsList.total > 0) {
          console.log('Collections disponibles:');
          collectionsList.documents.forEach(collection => {
            console.log(`- ${collection.$id} (${collection.name})`);
          });
        } else {
          console.log('Aucune collection trouvée. Vous devez créer les collections en exécutant le script create-appwrite-collections.js');
        }
      } catch (error) {
        if (error.code === 404) {
          console.log(`✅ La clé API a la permission collections.read, mais la base de données n'existe pas`);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error(`❌ La clé API n'a pas la permission collections.read:`, error.message);
      console.log('Code d\'erreur:', error.code);
      console.log('Type d\'erreur:', error.type);
    }
    
    console.log('\n📋 Résumé:');
    console.log('Pour que les scripts de création fonctionnent correctement, la clé API doit avoir les permissions suivantes:');
    console.log('- databases.read');
    console.log('- databases.write');
    console.log('- collections.read');
    console.log('- collections.write');
    console.log('- documents.read');
    console.log('- documents.write');
    
    console.log('\n🔧 Solutions:');
    console.log('1. Vérifiez que la clé API est correctement configurée dans le fichier .env.local');
    console.log('2. Assurez-vous que la clé API a toutes les permissions nécessaires');
    console.log('3. Si la base de données n\'existe pas, exécutez le script create-database.js');
    console.log('4. Si les collections n\'existent pas, exécutez le script create-appwrite-collections.js');
    
  } catch (error) {
    console.error('Erreur générale:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
checkApiKeyPermissions().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});