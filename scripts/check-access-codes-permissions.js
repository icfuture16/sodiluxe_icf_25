/**
 * Script pour vérifier les permissions de la collection access_codes dans Appwrite
 */

require('dotenv').config({ path: __dirname + '/.env' });
const sdk = require('node-appwrite');
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

// Initialiser le client Appwrite
const client = new sdk.Client();
client.setEndpoint(ENDPOINT);
client.setProject(PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

async function checkAccessCodesPermissions() {
  console.log('Vérification des permissions pour la collection access_codes...');
  
  try {
    // Récupérer la collection access_codes
    const collection = await databases.getCollection(
      DATABASE_ID,
      COLLECTIONS.ACCESS_CODES
    );
    
    console.log('✅ Collection access_codes trouvée!');
    console.log('ID:', collection.$id);
    console.log('Nom:', collection.name);
    console.log('Permissions actuelles:', JSON.stringify(collection.$permissions, null, 2));
    
    // Vérifier si les permissions sont correctement configurées
    const hasUserReadPermission = collection.$permissions.includes('read("users")');
    const hasUserCreatePermission = collection.$permissions.includes('create("users")');
    const hasUserUpdatePermission = collection.$permissions.includes('update("users")');
    const hasUserDeletePermission = collection.$permissions.includes('delete("users")');
    const hasGuestReadPermission = collection.$permissions.includes('read("guests")');
    
    console.log('\nAnalyse des permissions:');
    console.log('- Lecture pour utilisateurs:', hasUserReadPermission ? '✅ OK' : '❌ Manquante');
    console.log('- Création pour utilisateurs:', hasUserCreatePermission ? '✅ OK' : '❌ Manquante');
    console.log('- Mise à jour pour utilisateurs:', hasUserUpdatePermission ? '✅ OK' : '❌ Manquante');
    console.log('- Suppression pour utilisateurs:', hasUserDeletePermission ? '✅ OK' : '❌ Manquante');
    console.log('- Lecture pour invités:', hasGuestReadPermission ? '✅ OK' : '❌ Manquante');
    
    const allPermissionsOK = hasUserReadPermission && hasUserCreatePermission && 
                           hasUserUpdatePermission && hasUserDeletePermission && 
                           hasGuestReadPermission;
    
    if (allPermissionsOK) {
      console.log('\n✅ Toutes les permissions sont correctement configurées!');
    } else {
      console.log('\n❌ Certaines permissions sont manquantes.');
      console.log('Solution: Exécutez le script fix-permissions-string-format.js pour configurer les permissions correctement.');
    }
    
    return collection;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des permissions:', error);
    
    if (error.code === 404) {
      console.log('La collection access_codes n\'existe pas. Veuillez la créer d\'abord.');
    } else if (error.code === 401) {
      console.log('Erreur d\'authentification. Vérifiez votre clé API et vos permissions.');
    }
    
    throw error;
  }
}

// Exécuter la fonction principale
checkAccessCodesPermissions()
  .then(() => {
    console.log('\n✅ Vérification terminée!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Échec de la vérification:', error);
    process.exit(1);
  });