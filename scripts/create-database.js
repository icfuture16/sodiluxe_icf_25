/**
 * Script pour créer la base de données Appwrite si elle n'existe pas
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Databases, ID } = require('node-appwrite');
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
  console.error('Exemple: APPWRITE_API_KEY=votre-cle-api node scripts/create-database.js');
  process.exit(1);
}

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY); // Clé API avec permissions suffisantes

const databases = new Databases(client);

// Fonction principale
async function createDatabase() {
  try {
    console.log('Vérification de la base de données Appwrite...');
    console.log(`ID de la base de données: ${DATABASE_ID}`);
    
    // Vérifier si la base de données existe, sinon la créer
    try {
      const database = await databases.get(DATABASE_ID);
      console.log(`✅ La base de données '${DATABASE_ID}' existe déjà:`);
      console.log(`   - Nom: ${database.name}`);
      console.log(`   - Description: ${database.description || 'Aucune description'}`);
    } catch (error) {
      if (error.code === 404) {
        console.log(`❌ La base de données '${DATABASE_ID}' n'existe pas. Création en cours...`);
        
        const database = await databases.create(DATABASE_ID, 'crm-sodiluxe', 'Base de données CRM Sodiluxe');
        
        console.log(`✅ Base de données '${DATABASE_ID}' créée avec succès:`);
        console.log(`   - Nom: ${database.name}`);
        console.log(`   - Description: ${database.description || 'Aucune description'}`);
      } else {
        console.error(`❌ Erreur lors de la vérification de la base de données:`, error);
        throw error;
      }
    }

    console.log('\n📋 Étapes suivantes:');
    console.log('1. Exécutez le script de création des collections:');
    console.log('   node scripts/create-appwrite-collections.js');
    console.log('2. Redémarrez votre serveur de développement:');
    console.log('   npm run dev');
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
createDatabase();