const { Client, Databases, ID } = require('node-appwrite');
const config = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(config.ENDPOINT)
  .setProject(config.PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = config.DATABASE_ID;
const USERS_COLLECTION_ID = config.COLLECTIONS.USERS;

// Fonction pour générer un user_seller
function generateUserSeller(name) {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${cleanName}_${timestamp}`;
}

async function createMissingUser() {
  try {
    console.log('🔍 Vérification de l\'utilisateur avec l\'ID: 688987f7003216df6426');
    
    // Vérifier si l'utilisateur existe déjà
    try {
      const existingUser = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        '688987f7003216df6426'
      );
      console.log('✅ L\'utilisateur existe déjà:', existingUser.fullName);
      return;
    } catch (error) {
      if (error.code !== 404) {
        throw error;
      }
      console.log('❌ Utilisateur non trouvé, création en cours...');
    }

    // Créer l'utilisateur manquant
    const userData = {
      email: 'user688987f7@sodiluxe.com',
      fullName: 'Utilisateur Système',
      role: 'seller',
      storeId: '6859971b0030b8c47c17' // ID du magasin par défaut
    };

    console.log('📝 Création de l\'utilisateur avec les données:', userData);

    const newUser = await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      '688987f7003216df6426', // ID spécifique
      userData
    );

    console.log('✅ Utilisateur créé avec succès!');
    console.log('📋 Détails:', {
      id: newUser.$id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      storeId: newUser.storeId
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);
    if (error.response) {
      console.error('📋 Détails de l\'erreur:', error.response);
    }
    process.exit(1);
  }
}

// Exécuter le script
createMissingUser();

