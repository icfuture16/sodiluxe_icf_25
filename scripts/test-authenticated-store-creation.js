/**
 * Script pour tester la création d'un document dans la collection 'stores' avec une session authentifiée
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Databases, ID, Account } = require('node-appwrite');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);
const account = new Account(client);

// Constantes
const COLLECTION_ID = COLLECTIONS.STORES;

// Données de test
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123456!';
const TEST_NAME = 'Test User';

async function testAuthenticatedStoreCreation() {
  console.log('=== Test de création d\'un magasin avec authentification ===');
  
  try {
    // 1. Vérifier les variables d'environnement
    console.log('\n1. Vérification des variables d\'environnement:');
    console.log(`   - NEXT_PUBLIC_APPWRITE_ENDPOINT: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ? '✅' : '❌'}`);
    console.log(`   - NEXT_PUBLIC_APPWRITE_PROJECT_ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? '✅' : '❌'}`);
    console.log(`   - APPWRITE_DATABASE_ID: ${DATABASE_ID ? '✅' : '❌'}`);
    
    if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || !DATABASE_ID) {
      throw new Error('Variables d\'environnement manquantes');
    }
    
    // 2. Créer une session anonyme
    console.log('\n2. Création d\'une session anonyme:');
    try {
      const session = await account.createAnonymousSession();
      console.log(`   ✅ Session anonyme créée avec succès: ${session.$id}`);
    } catch (error) {
      console.log(`   ❌ Échec de la création de session anonyme: ${error.message}`);
      console.log('   Cela peut être dû à une configuration CORS incorrecte ou à des restrictions de sécurité.');
    }
    
    // 3. Tenter de créer un utilisateur de test (si nécessaire)
    console.log('\n3. Tentative de création d\'un utilisateur de test:');
    let userId = null;
    try {
      const user = await account.create(
        ID.unique(),
        TEST_EMAIL,
        TEST_PASSWORD,
        TEST_NAME
      );
      userId = user.$id;
      console.log(`   ✅ Utilisateur créé avec succès: ${userId}`);
    } catch (error) {
      if (error.code === 409) {
        console.log('   ℹ️ L\'utilisateur existe déjà, tentative de connexion...');
      } else {
        console.log(`   ❌ Échec de la création de l'utilisateur: ${error.message} (code: ${error.code})`);
      }
    }
    
    // 4. Se connecter avec l'utilisateur de test
    console.log('\n4. Connexion avec l\'utilisateur de test:');
    try {
      const session = await account.createEmailPasswordSession(TEST_EMAIL, TEST_PASSWORD);
      console.log(`   ✅ Connexion réussie: ${session.$id}`);
      
      // Vérifier l'utilisateur actuel
      const currentUser = await account.get();
      console.log(`   ✅ Utilisateur connecté: ${currentUser.name} (${currentUser.email})`);
    } catch (error) {
      console.log(`   ❌ Échec de la connexion: ${error.message} (code: ${error.code})`);
      console.log('   Impossible de continuer sans session authentifiée.');
      throw error;
    }
    
    // 5. Tenter de créer un document dans la collection 'stores'
    console.log('\n5. Tentative de création d\'un magasin:');
    try {
      const storeData = {
        name: 'Magasin de Test',
        address: '123 Rue de Test',
        phone: '+221 77 123 45 67',
        isActive: true,
        brand: 'sillage'
      };
      
      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        storeData
      );
      
      console.log(`   ✅ Magasin créé avec succès: ${result.$id}`);
      console.log(`   Données: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.log(`   ❌ Échec de la création du magasin: ${error.message} (code: ${error.code})`);
      
      // Analyser l'erreur
      if (error.code === 401) {
        console.log('   Cause probable: Authentification insuffisante ou session expirée.');
      } else if (error.code === 400) {
        console.log('   Cause probable: Données invalides ou manquantes.');
      } else if (error.code === 403) {
        console.log('   Cause probable: Permissions insuffisantes.');
        console.log('   Vérifiez que l\'utilisateur a les permissions nécessaires pour créer des documents.');
      }
    }
    
    // 6. Se déconnecter
    console.log('\n6. Déconnexion:');
    try {
      await account.deleteSession('current');
      console.log('   ✅ Déconnexion réussie');
    } catch (error) {
      console.log(`   ❌ Échec de la déconnexion: ${error.message}`);
    }
    
    // 7. Recommandations
    console.log('\n=== Recommandations ===');
    console.log('1. Vérifiez les permissions de la collection "stores" dans la console Appwrite');
    console.log('2. Assurez-vous que les utilisateurs authentifiés ont les permissions de création');
    console.log('3. Vérifiez que tous les champs requis sont correctement définis');
    console.log('4. Vérifiez que l\'utilisateur est correctement authentifié avant de créer un document');
    console.log('5. Examinez les journaux d\'erreur dans la console Appwrite pour plus de détails');
    
  } catch (error) {
    console.error(`Erreur générale: ${error.message}`);
  }
}

testAuthenticatedStoreCreation();

