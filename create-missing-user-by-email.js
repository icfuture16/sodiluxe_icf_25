const { Client, Databases, Query } = require('node-appwrite');

// Configuration Appwrite
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('67547b8b0035b8c0b4b4')
  .setKey('standard_a4c2c8b5b8f8b9c8e8f8b9c8e8f8b9c8e8f8b9c8e8f8b9c8e8f8b9c8e8f8b9c8e8f8b9c8');

const databases = new Databases(client);

const DATABASE_ID = '67547c0c000a9b8b5b4b';
const COLLECTIONS = {
  USERS: '67547c1b002c9b8b5b4b'
};

async function createMissingUser() {
  try {
    const missingUserId = '688987f7003216df6426';
    const userEmail = 'marielle.ecqm19@example.com'; // Email supposé
    const userFullName = 'Marielle ecqm19';
    
    console.log(`Vérification de l'existence de l'utilisateur ${missingUserId}...`);
    
    // Vérifier si l'utilisateur existe déjà
    try {
      const existingUser = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        missingUserId
      );
      console.log('Utilisateur déjà existant:', existingUser);
      return;
    } catch (error) {
      if (error.code !== 404) {
        throw error;
      }
      console.log('Utilisateur non trouvé, création en cours...');
    }
    
    // Générer le user_seller
    const userSeller = generateUserSeller(userFullName);
    console.log(`user_seller généré: '${userSeller}' pour '${userFullName}'`);
    
    // Créer l'utilisateur avec l'ID spécifique
    const userData = {
      fullName: userFullName,
      email: userEmail,
      role: 'seller',
      storeId: '67547c2b003a9b8b5b4b', // ID du magasin par défaut
      user_seller: userSeller,
      isActive: true
    };
    
    console.log('Données utilisateur à créer:', userData);
    
    const createdUser = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      missingUserId, // Utiliser l'ID spécifique
      userData
    );
    
    console.log('✅ Utilisateur créé avec succès:', {
      id: createdUser.$id,
      fullName: createdUser.fullName,
      email: createdUser.email,
      user_seller: createdUser.user_seller
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
    if (error.message) {
      console.error('Message d\'erreur:', error.message);
    }
  }
}

// Fonction generateUserSeller locale
function generateUserSeller(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return 'UNKNOWN';
  }
  
  return fullName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Supprimer les caractères spéciaux
    .split(/\s+/) // Diviser par espaces
    .map(word => word.substring(0, 4)) // Prendre les 4 premiers caractères de chaque mot
    .join('') // Joindre sans espaces
    .substring(0, 9); // Limiter à 9 caractères
}

createMissingUser();