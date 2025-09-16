/**
 * Script pour tester la connexion à la base de données Appwrite
 * Ce script teste spécifiquement l'accès à la collection des magasins
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Databases, Query } = require('node-appwrite');
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
const DATABASE_ID = '68bf1e7b003c6b340d6e'; // Utiliser l'ID de la base de données de client.ts
const COLLECTIONS = {
  STORES: 'stores',
  USERS: 'users',
  CLIENTS: 'clients',
  PRODUCTS: 'products',
  SALES: 'sales',
  SALE_ITEMS: 'sale_items'
};

// Fonction principale
async function testDatabaseConnection() {
  try {
    console.log('Test de connexion à la base de données Appwrite...');
    console.log(`Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);
    console.log(`Project ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);
    console.log(`Database ID: ${DATABASE_ID}`);
    
    // Tester la connexion à la collection des magasins
    console.log('\nTest de la collection des magasins...');
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STORES,
        [Query.orderAsc('name')]
      );
      
      console.log(`✅ Connexion réussie à la collection des magasins`);
      console.log(`Nombre de documents: ${response.documents.length}`);
      
      if (response.documents.length > 0) {
        console.log('\nPremier magasin:');
        console.log(`- ID: ${response.documents[0].$id}`);
        console.log(`- Nom: ${response.documents[0].name}`);
      } else {
        console.log('\nAucun magasin trouvé dans la collection.');
      }
      
    } catch (error) {
      console.error(`❌ Erreur lors de la connexion à la collection des magasins:`, error);
      console.log('Code d\'erreur:', error.code);
      console.log('Type d\'erreur:', error.type);
      console.log('Message d\'erreur:', error.message);
      
      if (error.code === 404) {
        console.log('\n🔍 Analyse de l\'erreur 404:');
        console.log('Cette erreur peut être causée par:');
        console.log('1. La base de données n\'existe pas - Exécutez le script create-database.js');
        console.log('2. La collection n\'existe pas - Exécutez le script create-appwrite-collections.js');
      } else if (error.code === 400) {
        console.log('\n🔍 Analyse de l\'erreur 400:');
        console.log('Cette erreur peut être causée par:');
        console.log('1. Un problème avec l\'ID de la base de données');
        console.log('2. Un problème avec l\'ID de la collection');
        console.log('\nVérifiez que l\'ID de la base de données dans client.ts correspond à celui dans .env.local');
        console.log(`ID dans ce script: ${DATABASE_ID}`);
        console.log(`ID dans .env.local: ${process.env.APPWRITE_DATABASE_ID || 'Non défini'}`);
      }
    }
    
    // Tester la connexion à la collection des produits
    console.log('\nTest de la collection des produits...');
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [Query.limit(1)]
      );
      
      console.log(`✅ Connexion réussie à la collection des produits`);
      console.log(`Nombre de documents: ${response.documents.length}`);
      
    } catch (error) {
      console.error(`❌ Erreur lors de la connexion à la collection des produits:`, error);
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
testDatabaseConnection().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});

