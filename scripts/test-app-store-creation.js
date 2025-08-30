/**
 * Script pour tester la création d'un magasin en utilisant les mêmes mécanismes que l'application Next.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const { Client, Databases, Account, ID } = require('node-appwrite');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);
const account = new Account(client);

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

async function testAppStoreCreation() {
  try {
    log.section('Test de création d\'un magasin via l\'application');
    
    // 1. Vérifier les variables d'environnement
    log.section('1. Vérification des variables d\'environnement:');
    const envVars = {
      'NEXT_PUBLIC_APPWRITE_ENDPOINT': process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
      'NEXT_PUBLIC_APPWRITE_PROJECT_ID': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
      'APPWRITE_DATABASE_ID': DATABASE_ID,
    };
    
    let missingVars = false;
    for (const [key, value] of Object.entries(envVars)) {
      if (!value) {
        log.error(`   - ${key}: ❌ Non défini`);
        missingVars = true;
      } else {
        log.success(`   - ${key}: ✅`);
      }
    }
    
    if (missingVars) {
      log.error('Variables d\'environnement manquantes. Veuillez les définir dans le fichier .env');
      return;
    }
    
    // 2. Créer un utilisateur de test ou se connecter
    log.section('2. Création/Connexion d\'un utilisateur de test:');
    const email = 'test@example.com';
    const password = 'Password123!';
    const name = 'Utilisateur Test';
    
    try {
      // Essayer de créer un utilisateur
      const user = await account.create(ID.unique(), email, password, name);
      log.success(`Utilisateur créé avec succès: ${user.$id}`);
      
      // Se connecter avec l'utilisateur créé
      const session = await account.createEmailPasswordSession(email, password);
      log.success(`Session créée avec succès: ${session.$id}`);
    } catch (error) {
      if (error.code === 409) {
        log.info(`L'utilisateur existe déjà, tentative de connexion...`);
        try {
          // Se connecter avec l'utilisateur existant
          const session = await account.createEmailPasswordSession(email, password);
          log.success(`Connexion réussie: ${session.$id}`);
        } catch (loginError) {
          log.error(`Échec de la connexion: ${loginError.message} (code: ${loginError.code})`);
          return;
        }
      } else {
        log.error(`Échec de la création de l'utilisateur: ${error.message} (code: ${error.code})`);
        return;
      }
    }
    
    // 3. Vérifier que l'utilisateur est bien connecté
    log.section('3. Vérification de l\'authentification:');
    try {
      const currentUser = await account.get();
      log.success(`Utilisateur authentifié: ${currentUser.name} (${currentUser.$id})`);
    } catch (error) {
      log.error(`Non authentifié: ${error.message}`);
      return;
    }
    
    // 4. Créer un magasin
    log.section('4. Création d\'un magasin:');
    const storeData = {
      name: 'Magasin Test App',
      address: '123 Rue de Test App',
      phone: '+33123456789',
      isActive: true,
      brand: 'sillage'
    };
    
    try {
      const newStore = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.STORES,
        ID.unique(),
        storeData
      );
      
      log.success(`Magasin créé avec succès: ${newStore.$id}`);
      log.info(`Données du magasin: ${JSON.stringify(newStore)}`);
      
      // 5. Supprimer le magasin de test
      log.section('5. Suppression du magasin de test:');
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.STORES, newStore.$id);
      log.success('Magasin supprimé avec succès');
      
    } catch (error) {
      log.error(`Échec de la création du magasin: ${error.message} (code: ${error.code})`);
      log.info('Causes possibles:');
      if (error.code === 401) {
        log.info('- Authentification: L\'utilisateur n\'est pas authentifié ou n\'a pas les permissions nécessaires');
      } else if (error.code === 400) {
        log.info('- Données invalides: Vérifiez que tous les champs requis sont présents et valides');
      } else if (error.code === 403) {
        log.info('- Permissions: L\'utilisateur n\'a pas les permissions nécessaires pour créer un magasin');
      }
    }
    
    // 6. Se déconnecter
    log.section('6. Déconnexion:');
    try {
      await account.deleteSession('current');
      log.success('Déconnexion réussie');
    } catch (error) {
      log.error(`Échec de la déconnexion: ${error.message}`);
    }
    
  } catch (error) {
    log.error(`Erreur générale: ${error.message}`);
  }
}

testAppStoreCreation();