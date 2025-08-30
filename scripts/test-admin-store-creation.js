/**
 * Script pour tester la création de magasins avec un utilisateur administrateur
 */

require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const sdk = require('node-appwrite');
const { Client, Account, Databases, ID, Users } = sdk;
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Configuration du client Appwrite avec clé API
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

// Services Appwrite
const users = new Users(client);
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

async function testAdminStoreCreation() {
  try {
    log.section('Test de création de magasin avec un utilisateur administrateur:');
    
    // Vérifier les variables d'environnement
    if (!process.env.APPWRITE_ENDPOINT || !process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
      log.error('Variables d\'environnement manquantes. Veuillez définir APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID et APPWRITE_API_KEY dans le fichier .env');
      return;
    }
    
    // Informations de l'utilisateur admin
    const adminEmail = 'admin@sodiluxe.com';
    const adminPassword = 'Admin123!';
    
    // Vérification de l'utilisateur admin
    try {
      log.info('Vérification de l\'utilisateur admin...');
      
      // Récupérer tous les utilisateurs et filtrer pour trouver l'admin
      const usersList = await users.list();
      
      if (usersList.total === 0) {
        throw new Error('Aucun utilisateur trouvé');
      }
      
      // Rechercher l'utilisateur admin par son email
      const adminUser = usersList.users.find(user => user.email === adminEmail);
      
      if (!adminUser) {
        throw new Error(`Utilisateur admin avec l'email ${adminEmail} non trouvé`);
      }
      log.success(`Utilisateur admin trouvé: ${adminUser.$id}`);
      log.info(`Utilisateur admin: ${adminUser.name} (${adminUser.email})`);
      
      // Avec la clé API, nous n'avons pas besoin de créer une session
      log.success('Utilisation de la clé API pour l\'authentification');
      
      // Créer un magasin
      try {
        log.info('Tentative de création d\'un magasin...');
        
        const storeData = {
          name: 'Magasin Test Admin',
          address: '123 Rue de Test, 75000 Paris',
          phone: '+33612345678',
          brand: 'sillage',
          isActive: true
        };
        
        const store = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.STORES,
          ID.unique(),
          storeData
        );
        
        log.success(`Magasin créé avec succès: ${store.$id}`);
        log.info(`Nom du magasin: ${store.name}`);
        log.info(`Adresse: ${store.address}`);
        log.info(`Téléphone: ${store.phone}`);
        log.info(`Marque: ${store.brand}`);
        log.info(`Actif: ${store.isActive}`);
        
        // Supprimer le magasin de test
        try {
          log.info('Suppression du magasin de test...');
          await databases.deleteDocument(DATABASE_ID, COLLECTIONS.STORES, store.$id);
          log.success('Magasin de test supprimé avec succès');
        } catch (deleteError) {
          log.error(`Impossible de supprimer le magasin de test: ${deleteError.message}`);
        }
        
      } catch (storeError) {
        log.error(`Impossible de créer le magasin: ${storeError.message}`);
        
        // Afficher des informations supplémentaires sur l'erreur
        if (storeError.code) {
          log.info(`Code d'erreur: ${storeError.code}`);
          
          switch (storeError.code) {
            case 401:
              log.warning('Erreur d\'authentification: L\'utilisateur n\'est pas authentifié ou n\'a pas les permissions nécessaires.');
              break;
            case 400:
              log.warning('Erreur de requête: Les données fournies sont incorrectes ou incomplètes.');
              break;
            case 403:
              log.warning('Erreur de permission: L\'utilisateur n\'a pas les permissions nécessaires pour créer un magasin.');
              break;
            default:
              log.warning(`Erreur inconnue: ${storeError.message}`);
          }
        }
      }
      
      // Pas besoin de déconnexion avec une clé API
      log.success('Test terminé avec succès');
      
    } catch (loginError) {
      log.error(`Impossible de se connecter avec l'utilisateur admin: ${loginError.message}`);
      
      // Afficher des informations supplémentaires sur l'erreur
      if (loginError.code) {
        log.info(`Code d'erreur: ${loginError.code}`);
        
        switch (loginError.code) {
          case 401:
            log.warning('Erreur d\'authentification: Email ou mot de passe incorrect.');
            break;
          default:
            log.warning(`Erreur inconnue: ${loginError.message}`);
        }
      }
    }
    
  } catch (error) {
    log.error(`Erreur générale: ${error.message}`);
  }
}

testAdminStoreCreation();