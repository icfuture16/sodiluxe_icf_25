/**
 * Script pour créer un utilisateur administrateur avec des permissions spécifiques
 */

require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const { Client, Users, ID, Teams, Databases } = require('node-appwrite');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite avec clé API
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);
const teams = new Teams(client);
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

async function createAdminUser() {
  try {
    log.section('Création d\'un utilisateur administrateur:');
    
    // Vérifier les variables d'environnement
    if (!process.env.APPWRITE_ENDPOINT || !process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
      log.error('Variables d\'environnement manquantes. Veuillez définir APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID et APPWRITE_API_KEY dans le fichier .env');
      return;
    }
    
    // Informations de l'utilisateur admin
    const adminEmail = 'admin@sodiluxe.com';
    const adminPassword = 'Admin123!';
    const adminName = 'Admin Sodiluxe';
    
    // Créer l'utilisateur admin ou récupérer s'il existe déjà
    let adminUser;
    try {
      // Vérifier si l'utilisateur existe déjà
      // Récupérer tous les utilisateurs et filtrer manuellement
      const usersList = await users.list();
      const adminUsers = usersList.users.filter(user => user.email === adminEmail);
      
      if (adminUsers.length > 0) {
        adminUser = adminUsers[0];
        log.info(`L'utilisateur admin existe déjà: ${adminUser.$id}`);
      } else {
        // Créer l'utilisateur admin
        adminUser = await users.create(ID.unique(), adminEmail, undefined, adminPassword, adminName);
        log.success(`Utilisateur admin créé avec succès: ${adminUser.$id}`);
      }
      
      // Vérifier si l'équipe 'admins' existe ou la créer
      let adminTeam;
      try {
        // Récupérer toutes les équipes et filtrer manuellement
        const teamsList = await teams.list();
        const adminTeams = teamsList.teams.filter(team => team.name === 'admins');
        
        if (adminTeams.length > 0) {
          adminTeam = adminTeams[0];
          log.info(`L'équipe 'admins' existe déjà: ${adminTeam.$id}`);
        } else {
          // Créer l'équipe 'admins'
          adminTeam = await teams.create(ID.unique(), 'admins', ['admin']);
          log.success(`Équipe 'admins' créée avec succès: ${adminTeam.$id}`);
        }
        
        // Ajouter l'utilisateur à l'équipe 'admins' s'il n'y est pas déjà
        try {
          const membership = await teams.createMembership(
            adminTeam.$id,
            ['admin'],
            undefined,
            adminUser.$id
          );
          log.success(`Utilisateur ajouté à l'équipe 'admins': ${membership.$id}`);
        } catch (membershipError) {
          if (membershipError.code === 409) {
            log.info(`L'utilisateur est déjà membre de l'équipe 'admins'`);
          } else {
            throw membershipError;
          }
        }
        
        // Créer un document utilisateur dans la collection 'users' s'il n'existe pas déjà
        try {
          // Récupérer tous les documents utilisateurs et filtrer manuellement
          const userDocsList = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.USERS
          );
          const adminUserDocs = userDocsList.documents.filter(doc => doc.email === adminEmail);
          
          if (adminUserDocs.length > 0) {
            log.info(`Le document utilisateur existe déjà dans la collection 'users'`);
          } else {
            const userDoc = await databases.createDocument(
              DATABASE_ID,
              COLLECTIONS.USERS,
              ID.unique(),
              {
                email: adminEmail,
                fullName: adminName,
                role: 'admin',
                storeId: ''
              }
            );
            log.success(`Document utilisateur créé dans la collection 'users': ${userDoc.$id}`);
          }
          
        } catch (userDocError) {
          log.error(`Impossible de créer/vérifier le document utilisateur: ${userDocError.message}`);
        }
        
        log.success(`Utilisateur administrateur configuré avec succès`);
        log.info(`Email: ${adminEmail}`);
        log.info(`Mot de passe: ${adminPassword}`);
        log.info(`Nom: ${adminName}`);
        
      } catch (teamError) {
        log.error(`Erreur lors de la gestion de l'équipe 'admins': ${teamError.message}`);
      }
      
    } catch (userError) {
      log.error(`Erreur lors de la création/récupération de l'utilisateur admin: ${userError.message}`);
    }
    
  } catch (error) {
    log.error(`Erreur générale: ${error.message}`);
  }
}

createAdminUser();

