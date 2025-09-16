// Script pour vérifier la collection access_codes et ses permissions
require('dotenv').config();
const { Client, Databases } = require('appwrite');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Afficher les variables d'environnement pour le débogage
console.log('Variables d\'environnement:');
console.log('NEXT_PUBLIC_APPWRITE_ENDPOINT:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
console.log('NEXT_PUBLIC_APPWRITE_PROJECT_ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
console.log('APPWRITE_API_KEY:', process.env.APPWRITE_API_KEY ? '***' : 'Non défini');

// Vérifier si les variables d'environnement sont définies
if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
  console.error('❌ La variable d\'environnement NEXT_PUBLIC_APPWRITE_ENDPOINT n\'est pas définie');
  console.log('Solution: Assurez-vous que le fichier .env.local contient NEXT_PUBLIC_APPWRITE_ENDPOINT');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  console.error('❌ La variable d\'environnement NEXT_PUBLIC_APPWRITE_PROJECT_ID n\'est pas définie');
  console.log('Solution: Assurez-vous que le fichier .env.local contient NEXT_PUBLIC_APPWRITE_PROJECT_ID');
  process.exit(1);
}

if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ La variable d\'environnement APPWRITE_API_KEY n\'est pas définie');
  console.log('Solution: Assurez-vous que le fichier .env.local contient APPWRITE_API_KEY');
  process.exit(1);
}

// Initialiser le client Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkAccessCodesCollection() {
  console.log('Vérification de la collection access_codes...');
  
  try {
    // Vérifier si la collection existe
    const collection = await databases.getCollection(
      DATABASE_ID,
      COLLECTIONS.ACCESS_CODES
    );
    
    console.log('✅ Collection access_codes trouvée!');
    console.log('ID:', collection.$id);
    console.log('Nom:', collection.name);
    console.log('Permissions:', collection.$permissions);
    
    // Vérifier si les permissions sont correctement configurées
    const hasGuestReadPermission = collection.$permissions.some(
      permission => permission.includes('read("user:guest")')
    );
    
    const hasAuthenticatedPermissions = collection.$permissions.some(
      permission => permission.includes('read("user:authenticated")')
    );
    
    if (hasGuestReadPermission) {
      console.log('✅ Les invités ont la permission de lecture');
    } else {
      console.log('❌ Les invités n\'ont PAS la permission de lecture');
      console.log('Solution: Exécutez le script configure-appwrite-permissions.js pour configurer les permissions');
    }
    
    if (hasAuthenticatedPermissions) {
      console.log('✅ Les utilisateurs authentifiés ont les permissions nécessaires');
    } else {
      console.log('❌ Les utilisateurs authentifiés n\'ont PAS les permissions nécessaires');
      console.log('Solution: Exécutez le script configure-appwrite-permissions.js pour configurer les permissions');
    }
    
    // Vérifier si la collection contient des documents
    const documents = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ACCESS_CODES
    );
    
    console.log(`✅ La collection contient ${documents.documents.length} codes d'accès`);
    
    if (documents.documents.length === 0) {
      console.log('⚠️ Aucun code d\'accès n\'est défini. Vous devriez en ajouter au moins un.');
    } else {
      console.log('Codes disponibles:');
      documents.documents.forEach(doc => {
        console.log(`- ${doc.code} (ID: ${doc.$id})`);
      });
    }
    
  } catch (error) {
    if (error.code === 404) {
      console.error('❌ La collection access_codes n\'existe pas!');
      console.log('Solution: Exécutez le script create-appwrite-collections.js pour créer les collections');
    } else {
      console.error('❌ Erreur lors de la vérification de la collection:', error);
    }
  }
}

checkAccessCodesCollection();

