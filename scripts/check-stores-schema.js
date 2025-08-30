/**
 * Script pour vérifier le schéma actuel de la collection 'stores'
 */

require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const { Client, Databases } = require('node-appwrite');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite avec clé API
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

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

async function checkStoresSchema() {
  try {
    log.section('Vérification du schéma de la collection "stores":');
    
    // Récupérer les informations sur la collection
    try {
      const collection = await databases.getCollection(DATABASE_ID, COLLECTIONS.STORES);
      log.success(`Collection trouvée: ${collection.name} (${collection.$id})`);
      log.info(`Description: ${collection.$createdAt}`);
      
      // Récupérer les attributs de la collection
      const attributes = await databases.listAttributes(DATABASE_ID, COLLECTIONS.STORES);
      log.success(`Nombre d'attributs: ${attributes.total}`);
      
      log.section('Liste des attributs:');
      attributes.attributes.forEach((attr, index) => {
        const required = attr.required ? 'Requis' : 'Optionnel';
        const defaultValue = attr.default !== undefined ? attr.default : 'Aucune';
        log.info(`${index + 1}. ${attr.key} (${attr.type}) - ${required}`);
        log.info(`   Format: ${attr.format || 'Standard'}`);
        log.info(`   Valeur par défaut: ${defaultValue}`);
        if (attr.array) log.info('   Type: Tableau');
        log.info('');
      });
      
      // Récupérer les index de la collection
      const indexes = await databases.listIndexes(DATABASE_ID, COLLECTIONS.STORES);
      log.section('Liste des index:');
      indexes.indexes.forEach((index, i) => {
        log.info(`${i + 1}. ${index.key} (${index.type})`);
        log.info(`   Attributs: ${index.attributes.join(', ')}`);
        log.info('');
      });
      
    } catch (error) {
      log.error(`Impossible de récupérer la collection: ${error.message}`);
      return;
    }
    
  } catch (error) {
    log.error(`Erreur générale: ${error.message}`);
  }
}

checkStoresSchema();