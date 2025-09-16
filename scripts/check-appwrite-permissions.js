/**
 * Script pour vérifier les permissions de la base de données et des collections dans Appwrite
 * Ce script aide à diagnostiquer les problèmes d'accès aux données
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Databases, Account, ID } = require('node-appwrite');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Vérification des variables d'environnement requises
if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  console.error('Erreur: Variables d\'environnement manquantes.');
  console.error('Veuillez définir NEXT_PUBLIC_APPWRITE_ENDPOINT et NEXT_PUBLIC_APPWRITE_PROJECT_ID dans le fichier .env.local');
  process.exit(1);
}

// Configuration Appwrite (client-side, sans clé API)
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Ajouter l'en-tête Origin pour simuler le comportement du navigateur
if (process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME) {
  console.log(`Ajout de l'en-tête Origin: ${process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME}`);
  client.headers['Origin'] = process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME;
}

const databases = new Databases(client);
const account = new Account(client);

// ID de la base de données et des collections
const DATABASE_ID = '68bf1e7b003c6b340d6e'; // Utiliser l'ID de la base de données de client.ts
const COLLECTIONS = {
  STORES: 'stores',
  USERS: 'users',
  CLIENTS: 'clients',
  PRODUCTS: 'products',
  SALES: 'sales',
  SALE_ITEMS: 'sale_items'
};

// Fonction pour vérifier si la base de données existe
async function checkDatabaseExists() {
  try {
    console.log(`Vérification de l'existence de la base de données (ID: ${DATABASE_ID})...`);
    
    // Tenter de lister les collections pour voir si la base de données existe
    try {
      const collections = await databases.listCollections(DATABASE_ID);
      console.log(`✅ La base de données existe et contient ${collections.total} collection(s)`);
      
      if (collections.total > 0) {
        console.log('\nCollections disponibles:');
        collections.documents.forEach(collection => {
          console.log(`- ${collection.$id} (${collection.name})`);
        });
      }
      
      return true;
    } catch (error) {
      if (error.code === 404) {
        console.error(`❌ La base de données avec l'ID ${DATABASE_ID} n'existe pas`);
        console.log('\n🔍 Solution:');
        console.log('1. Vérifiez que l\'ID de la base de données est correct dans .env.local et client.ts');
        console.log('2. Créez la base de données en exécutant le script create-database.js avec une clé API valide');
      } else {
        console.error(`❌ Erreur lors de la vérification de la base de données:`, error);
      }
      return false;
    }
  } catch (error) {
    console.error('Erreur générale:', error);
    return false;
  }
}

// Fonction pour vérifier les permissions d'une collection
async function checkCollectionPermissions(collectionId) {
  try {
    console.log(`\nVérification des permissions pour la collection ${collectionId}...`);
    
    try {
      // Tenter de lister les documents pour voir si nous avons accès
      const documents = await databases.listDocuments(
        DATABASE_ID,
        collectionId,
        []
      );
      
      console.log(`✅ Accès réussi à la collection ${collectionId}`);
      console.log(`Nombre de documents: ${documents.total}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de l'accès à la collection ${collectionId}:`, error.message);
      console.log('Code d\'erreur:', error.code);
      console.log('Type d\'erreur:', error.type);
      
      if (error.code === 404) {
        console.log('\n🔍 Analyse:');
        console.log(`La collection ${collectionId} n'existe pas dans la base de données.`);
        console.log('Solution: Créez la collection en exécutant le script create-appwrite-collections.js');
      } else if (error.code === 401) {
        console.log('\n🔍 Analyse:');
        console.log(`Problème de permissions pour la collection ${collectionId}.`);
        console.log('Solution: Vérifiez les permissions de la collection dans la console Appwrite:');
        console.log('1. Accédez à la console Appwrite > Databases > Votre base de données > Collections');
        console.log(`2. Sélectionnez la collection ${collectionId} > Permissions`);
        console.log('3. Assurez-vous que les permissions suivantes sont configurées:');
        console.log('   - Pour les utilisateurs anonymes: "read" (si l\'accès public est nécessaire)');
        console.log('   - Pour les utilisateurs authentifiés: "read" et/ou "create" selon les besoins');
      }
      
      return false;
    }
  } catch (error) {
    console.error('Erreur générale:', error);
    return false;
  }
}

// Fonction principale
async function checkAppwritePermissions() {
  try {
    console.log('Vérification des permissions Appwrite...');
    console.log(`Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);
    console.log(`Project ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);
    console.log(`Database ID: ${DATABASE_ID}`);
    
    // Vérifier si la base de données existe
    const databaseExists = await checkDatabaseExists();
    
    if (databaseExists) {
      // Vérifier les permissions pour chaque collection
      for (const [key, collectionId] of Object.entries(COLLECTIONS)) {
        await checkCollectionPermissions(collectionId);
      }
    }
    
    console.log('\n📋 Résumé:');
    console.log('Si vous rencontrez des erreurs 404, vous devez créer la base de données et les collections.');
    console.log('Si vous rencontrez des erreurs 401, vous devez configurer les permissions correctement.');
    console.log('\n🔧 Solutions:');
    console.log('1. Assurez-vous que votre clé API a les permissions nécessaires pour créer des bases de données et des collections.');
    console.log('2. Exécutez le script create-database.js pour créer la base de données.');
    console.log('3. Exécutez le script create-appwrite-collections.js pour créer les collections.');
    console.log('4. Configurez les permissions des collections dans la console Appwrite.');
    console.log('5. Vérifiez que les plateformes sont correctement configurées dans la console Appwrite.');
    
  } catch (error) {
    console.error('Erreur générale:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
checkAppwritePermissions().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});

