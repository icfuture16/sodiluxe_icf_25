/**
 * Script pour tester la création d'un document dans la collection 'stores'
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

async function testStoreCreation() {
  try {
    console.log('Test de création d\'un document dans la collection "stores"');
    console.log('---------------------------------------------------');
    
    // 1. Vérifier les variables d'environnement
    console.log('\n1. Vérification des variables d\'environnement:');
    console.log(`   - NEXT_PUBLIC_APPWRITE_ENDPOINT: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ? '✓' : '✗'}`);
    console.log(`   - NEXT_PUBLIC_APPWRITE_PROJECT_ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? '✓' : '✗'}`);
    console.log(`   - APPWRITE_DATABASE_ID: ${DATABASE_ID ? '✓' : '✗'}`);
    
    if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || !DATABASE_ID) {
      throw new Error('Variables d\'environnement manquantes');
    }
    
    // 2. Tenter de créer une session anonyme
    console.log('\n2. Création d\'une session anonyme:');
    try {
      const session = await account.createAnonymousSession();
      console.log(`   ✓ Session anonyme créée avec succès: ${session.$id}`);
    } catch (error) {
      console.log(`   ✗ Échec de la création de session anonyme: ${error.message}`);
      console.log('   Cela peut être dû à une configuration CORS incorrecte ou à des restrictions de sécurité.');
    }
    
    // 3. Tenter de créer un document sans authentification
    console.log('\n3. Tentative de création d\'un document sans authentification:');
    try {
      const storeData = {
        name: 'Test Store',
        address: '123 Test Street',
        phone: '+1234567890'
      };
      
      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        storeData
      );
      
      console.log(`   ✓ Document créé avec succès: ${result.$id}`);
      console.log(`   Données: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.log(`   ✗ Échec de la création du document: ${error.message}`);
      console.log(`   Code d'erreur: ${error.code}`);
      
      // Analyser l'erreur
      if (error.code === 401) {
        console.log('   Cause probable: Authentification requise pour créer des documents dans cette collection.');
        console.log('   Solution: Assurez-vous d\'être connecté avant de créer un document.');
      } else if (error.code === 400) {
        console.log('   Cause probable: Données invalides ou manquantes.');
        console.log('   Solution: Vérifiez que tous les champs requis sont fournis et valides.');
      } else if (error.code === 403) {
        console.log('   Cause probable: Permissions insuffisantes.');
        console.log('   Solution: Vérifiez les permissions de la collection dans la console Appwrite.');
      }
    }
    
    // 4. Vérifier les permissions de la collection
    console.log('\n4. Recommandations:');
    console.log('   - Vérifiez les permissions de la collection "stores" dans la console Appwrite');
    console.log('   - Assurez-vous que les utilisateurs authentifiés ont les permissions de création');
    console.log('   - Vérifiez que tous les champs requis sont correctement définis');
    console.log('   - Assurez-vous que l\'utilisateur est correctement authentifié avant de créer un document');
    
  } catch (error) {
    console.error(`Erreur: ${error.message}`);
  }
}

testStoreCreation();