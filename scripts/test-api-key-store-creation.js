/**
 * Script pour tester la création d'un document dans la collection 'stores' avec une clé API
 */

require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const { Client, Databases, ID } = require('node-appwrite');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite avec clé API
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Constantes
const COLLECTION_ID = COLLECTIONS.STORES;

// Fonction pour afficher les messages en couleur
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
};

async function testApiKeyStoreCreation() {
  try {
    log.section('1. Vérification de la configuration:');
    log.info(`APPWRITE_ENDPOINT: ${process.env.APPWRITE_ENDPOINT ? 'Défini' : 'Non défini'}`);
    log.info(`APPWRITE_PROJECT_ID: ${process.env.APPWRITE_PROJECT_ID ? 'Défini' : 'Non défini'}`);
    log.info(`APPWRITE_API_KEY: ${process.env.APPWRITE_API_KEY ? 'Défini' : 'Non défini'}`);
    log.info(`DATABASE_ID: ${DATABASE_ID}`);
    log.info(`Collection STORES: ${COLLECTIONS.STORES}`);

    if (!process.env.APPWRITE_ENDPOINT || !process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
      log.error('Variables d\'environnement manquantes. Vérifiez votre fichier .env');
      return;
    }

    // Vérifier si la collection existe
    try {
      const collection = await databases.getCollection(DATABASE_ID, COLLECTIONS.STORES);
      log.success(`Collection "${COLLECTIONS.STORES}" trouvée avec l'ID: ${collection.$id}`);
      log.info(`Permissions: ${JSON.stringify(collection.permissions)}`);
    } catch (error) {
      log.error(`Collection "${COLLECTIONS.STORES}" non trouvée: ${error.message}`);
      return;
    }

    log.section('2. Tentative de création d\'un document avec API key:');
    try {
      const storeData = {
        name: 'Magasin Test API',
        address: '123 Rue de Test API',
        phone: '+33123456789',
        isActive: true,
        brand: 'sillage'
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.STORES,
        ID.unique(),
        storeData
      );

      log.success(`Document créé avec succès! ID: ${result.$id}`);
      log.info(`Données du document: ${JSON.stringify(result)}`);

      // Supprimer le document de test
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.STORES, result.$id);
      log.success(`Document de test supprimé avec succès`);
    } catch (error) {
      log.error(`Échec de la création du document: ${error.message}`);
      log.info(`Code d'erreur: ${error.code}`);
      log.info(`Cause probable: Vérifiez les permissions de la collection et les champs requis`);
    }

    log.section('3. Vérification des permissions de la collection:');
    try {
      const collection = await databases.getCollection(DATABASE_ID, COLLECTIONS.STORES);
      log.info(`Permissions de la collection:`);
      collection.permissions.forEach((permission, index) => {
        log.info(`  ${index + 1}. ${permission}`);
      });

      log.info(`\nRecommandations pour les permissions:`);
      log.info(`  - Pour permettre la création par les utilisateurs authentifiés: "create(\"users\")"`);
      log.info(`  - Pour permettre la lecture par tous: "read(\"any\")"`);
    } catch (error) {
      log.error(`Impossible de récupérer les permissions: ${error.message}`);
    }

  } catch (error) {
    log.error(`Erreur générale: ${error.message}`);
  }
}

testApiKeyStoreCreation();

