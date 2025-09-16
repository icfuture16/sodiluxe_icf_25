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

// Initialiser le client Appwrite sans chaînage de méthodes
const client = new Client();

// Configurer le client étape par étape sans chaînage
client.setEndpoint(ENDPOINT);
client.setProject(PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

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
    const result = await databases.updateCollection(
      DATABASE_ID,
      COLLECTIONS.ACCESS_CODES,
      collection.name,
      collection.enabled,
      collection.documentSecurity,
      [
        // Permissions pour les utilisateurs authentifiés (lecture, création, mise à jour, suppression)
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
        
        // Permissions pour les invités (lecture seule)
        Permission.read(Role.guests())
      ]
    );
    
    console.log('✅ Permissions mises à jour avec succès!');
    console.log('Nouvelles permissions:', result.$permissions);
    
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des permissions:', error);
    
    if (error.code === 404) {
      console.log('La collection access_codes n\'existe pas. Veuillez la créer d\'abord.');
    } else if (error.code === 401) {
      console.log('Erreur d\'authentification. Vérifiez votre clé API et vos permissions.');
    }
    
    throw error;
  }
}

// Exécuter la fonction principale
configureAccessCodesPermissions()
  .then(() => {
    console.log('✅ Configuration terminée avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Échec de la configuration:', error);
    process.exit(1);
  });

