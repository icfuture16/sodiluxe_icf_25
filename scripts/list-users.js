/**
 * Script pour lister les utilisateurs existants dans Appwrite
 */

require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const { Client, Users } = require('node-appwrite');

// Configuration Appwrite avec clé API
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

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

async function listUsers() {
  try {
    log.section('Liste des utilisateurs existants:');
    
    // Vérifier les variables d'environnement
    if (!process.env.APPWRITE_ENDPOINT || !process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
      log.error('Variables d\'environnement manquantes. Veuillez définir APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID et APPWRITE_API_KEY dans le fichier .env');
      return;
    }
    
    // Récupérer la liste des utilisateurs
    try {
      const usersList = await users.list();
      
      if (usersList.total === 0) {
        log.warning('Aucun utilisateur trouvé');
        return;
      }
      
      log.success(`${usersList.total} utilisateur(s) trouvé(s)`);
      
      // Afficher les détails de chaque utilisateur
      usersList.users.forEach((user, index) => {
        log.section(`Utilisateur ${index + 1}:`);
        log.info(`ID: ${user.$id}`);
        log.info(`Email: ${user.email}`);
        log.info(`Nom: ${user.name}`);
        log.info(`Statut: ${user.status ? 'Actif' : 'Inactif'}`);
        log.info(`Créé le: ${new Date(user.$createdAt).toLocaleString()}`);
      });
      
    } catch (error) {
      log.error(`Impossible de récupérer la liste des utilisateurs: ${error.message} (code: ${error.code})`);
    }
    
  } catch (error) {
    log.error(`Erreur générale: ${error.message}`);
  }
}

listUsers();