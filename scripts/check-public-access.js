/**
 * Script pour vérifier l'accès public aux données Appwrite
 * Ce script teste si l'application peut accéder aux données sans authentification
 * en utilisant directement les endpoints publics
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

// ID de la base de données et des collections
const DATABASE_ID = '68599714002eef233c16'; // Utiliser l'ID de la base de données de client.ts
const COLLECTIONS = {
  STORES: 'stores',
  PRODUCTS: 'products',
  SALES: 'sales'
};

// Fonction pour tester l'accès public à une collection
async function testPublicAccess(collectionId) {
  try {
    console.log(`\nTest d'accès public à la collection ${collectionId}...`);
    
    try {
      // Tenter de lister les documents pour voir si nous avons accès public
      const documents = await databases.listDocuments(
        DATABASE_ID,
        collectionId
      );
      
      console.log(`✅ Accès public réussi à la collection ${collectionId}`);
      console.log(`Nombre de documents: ${documents.total}`);
      
      if (documents.total > 0) {
        console.log('Premier document:');
        console.log(JSON.stringify(documents.documents[0], null, 2));
      } else {
        console.log('Aucun document trouvé.');
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de l'accès public à la collection ${collectionId}:`, error.message);
      console.log('Code d\'erreur:', error.code);
      console.log('Type d\'erreur:', error.type);
      
      if (error.code === 404) {
        console.log('\n🔍 Analyse:');
        console.log(`La base de données ou la collection ${collectionId} n'existe pas.`);
        console.log('Solutions:');
        console.log('1. Vérifiez que l\'ID de la base de données est correct');
        console.log('2. Créez la base de données et les collections avec les scripts appropriés');
      } else if (error.code === 401) {
        console.log('\n🔍 Analyse:');
        console.log(`La collection ${collectionId} n'est pas accessible publiquement.`);
        console.log('Solutions:');
        console.log('1. Configurez les permissions de la collection pour permettre l\'accès public:');
        console.log('   - Accédez à la console Appwrite > Databases > Votre base de données > Collections');
        console.log(`   - Sélectionnez la collection ${collectionId} > Permissions`);
        console.log('   - Ajoutez la permission "read" pour le rôle "any"');
      }
      
      return false;
    }
  } catch (error) {
    console.error('Erreur générale:', error);
    return false;
  }
}

// Fonction principale
async function checkPublicAccess() {
  try {
    console.log('Vérification de l\'accès public aux données Appwrite...');
    console.log(`Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);
    console.log(`Project ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);
    console.log(`Database ID: ${DATABASE_ID}`);
    
    // Tester l'accès public pour chaque collection
    const results = {};
    for (const [key, collectionId] of Object.entries(COLLECTIONS)) {
      results[collectionId] = await testPublicAccess(collectionId);
    }
    
    console.log('\n📋 Résumé des résultats:');
    for (const [collectionId, success] of Object.entries(results)) {
      console.log(`${success ? '✅' : '❌'} Collection ${collectionId}: ${success ? 'Accessible publiquement' : 'Non accessible publiquement'}`);
    }
    
    console.log('\n🔧 Recommandations:');
    console.log('1. Pour les collections qui doivent être accessibles sans authentification:');
    console.log('   - Configurez les permissions pour permettre l\'accès en lecture au rôle "any"');
    console.log('2. Pour les collections qui nécessitent une authentification:');
    console.log('   - Assurez-vous que les utilisateurs sont correctement authentifiés avant d\'accéder aux données');
    console.log('   - Vérifiez que les permissions sont configurées pour les rôles appropriés');
    console.log('3. Vérifiez que les plateformes sont correctement configurées dans la console Appwrite:');
    console.log(`   - Ajoutez ${process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME} comme plateforme autorisée`);
    
  } catch (error) {
    console.error('Erreur générale:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
checkPublicAccess().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});