// Script pour configurer les permissions de la collection access_codes avec Appwrite v16.0.2
require('dotenv').config({ path: __dirname + '/.env' });
const { Client, Databases, Permission, Role } = require('appwrite');
const { DATABASE_ID, COLLECTIONS, ENDPOINT, PROJECT_ID } = require('./appwrite-config');

// Afficher les informations de configuration
console.log('Configuration Appwrite:');
console.log('Endpoint:', ENDPOINT);
console.log('Project ID:', PROJECT_ID);
console.log('Database ID:', DATABASE_ID);
console.log('Collection:', COLLECTIONS.ACCESS_CODES);
console.log('API Key:', process.env.APPWRITE_API_KEY ? '***' : 'Non défini');

// Vérifier si la clé API est définie
if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ La variable d\'environnement APPWRITE_API_KEY n\'est pas définie');
  console.log('Solution: Assurez-vous que le fichier .env dans le dossier scripts contient APPWRITE_API_KEY');
  process.exit(1);
}

// Initialiser le client Appwrite selon la documentation v16.0.2
const client = new Client();

// Configurer le client - IMPORTANT: setKey doit être appelé après setEndpoint et setProject
client
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function configureAccessCodesPermissions() {
  console.log('Configuration des permissions pour la collection access_codes...');
  
  try {
    // Vérifier si la collection existe avant de modifier les permissions
    const collection = await databases.getCollection(
      DATABASE_ID,
      COLLECTIONS.ACCESS_CODES
    );
    
    console.log('✅ Collection access_codes trouvée!');
    console.log('ID:', collection.$id);
    console.log('Nom:', collection.name);
    console.log('Permissions actuelles:', collection.$permissions);
    
    // Définir les nouvelles permissions pour la collection access_codes
    // Utiliser les classes Permission et Role de la v16.0.2
    const result = await databases.updateCollection(
      DATABASE_ID,
      COLLECTIONS.ACCESS_CODES,
      collection.name,
      collection.$permissions,
      [
        // Permissions pour les utilisateurs authentifiés
        Permission.create(Role.users()),
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
        
        // Permissions pour les invités (lecture seule)
        Permission.read(Role.guests())
      ]
    );
    
    console.log('✅ Permissions configurées avec succès pour access_codes');
    console.log('Nouvelles permissions:', result.$permissions);
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des permissions:', error);
    
    if (error.code === 404) {
      console.error('La collection access_codes n\'existe pas. Veuillez la créer d\'abord.');
    } else {
      console.error('Détails de l\'erreur:', error.message);
      console.error('Code d\'erreur:', error.code);
      
      if (error.response) {
        console.error('Réponse du serveur:', error.response);
      }
    }
  }
}

// Exécuter la fonction
configureAccessCodesPermissions()
  .then(() => {
    console.log('Script terminé.');
  })
  .catch((error) => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  });

