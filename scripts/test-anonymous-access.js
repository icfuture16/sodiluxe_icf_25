/**
 * Script pour tester l'accès anonyme aux données Appwrite
 * Ce script teste si l'application peut accéder aux données sans authentification
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
const DATABASE_ID = '68599714002eef233c16'; // Utiliser l'ID de la base de données de client.ts
const COLLECTIONS = {
  STORES: 'stores',
  USERS: 'users',
  CLIENTS: 'clients',
  PRODUCTS: 'products',
  SALES: 'sales',
  SALE_ITEMS: 'sale_items'
};

// Fonction principale
async function testAnonymousAccess() {
  try {
    console.log('Test d\'accès anonyme aux données Appwrite...');
    console.log(`Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);
    console.log(`Project ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);
    console.log(`Database ID: ${DATABASE_ID}`);
    
    // Créer une session anonyme
    console.log('\nCréation d\'une session anonyme...');
    try {
      const session = await account.createAnonymousSession();
      console.log(`✅ Session anonyme créée avec succès`);
      console.log(`ID de session: ${session.$id}`);
      console.log(`Utilisateur: ${session.userId}`);
      
      // Tester l'accès à la collection des magasins
      console.log('\nTest d\'accès à la collection des magasins...');
      try {
        const stores = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.STORES
        );
        
        console.log(`✅ Accès réussi à la collection des magasins`);
        console.log(`Nombre de magasins: ${stores.total}`);
        
        if (stores.documents.length > 0) {
          console.log('\nPremier magasin:');
          console.log(`- ID: ${stores.documents[0].$id}`);
          console.log(`- Nom: ${stores.documents[0].name}`);
        } else {
          console.log('Aucun magasin trouvé.');
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors de l'accès à la collection des magasins:`, error);
        console.log('Code d\'erreur:', error.code);
        console.log('Type d\'erreur:', error.type);
        console.log('Message d\'erreur:', error.message);
        
        if (error.code === 404) {
          console.log('\n🔍 Analyse de l\'erreur 404:');
          console.log('Cette erreur peut être causée par:');
          console.log('1. La base de données n\'existe pas');
          console.log('2. La collection n\'existe pas');
          console.log('3. L\'ID de la base de données est incorrect');
        } else if (error.code === 401) {
          console.log('\n🔍 Analyse de l\'erreur 401:');
          console.log('Cette erreur peut être causée par:');
          console.log('1. Les permissions de la collection ne permettent pas l\'accès anonyme');
          console.log('2. La session anonyme n\'a pas été créée correctement');
        }
      }
      
      // Déconnexion
      console.log('\nDéconnexion de la session anonyme...');
      await account.deleteSession('current');
      console.log('✅ Session supprimée avec succès');
      
    } catch (error) {
      console.error(`❌ Erreur lors de la création de la session anonyme:`, error);
      console.log('Code d\'erreur:', error.code);
      console.log('Type d\'erreur:', error.type);
      console.log('Message d\'erreur:', error.message);
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
testAnonymousAccess().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});