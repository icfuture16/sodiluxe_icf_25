/**
 * Script pour synchroniser un utilisateur manquant de l'authentification vers la collection users
 */

const { Client, Databases, Users, ID } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { DATABASE_ID, PROJECT_ID, ENDPOINT, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);

async function syncMissingUser(userId) {
  try {
    console.log(`🔍 Récupération de l'utilisateur ${userId} depuis l'authentification...`);
    
    // Récupérer l'utilisateur depuis l'authentification
    const authUser = await users.get(userId);
    console.log('✅ Utilisateur trouvé dans l\'authentification:');
    console.log(`  ID: ${authUser.$id}`);
    console.log(`  Nom: ${authUser.name}`);
    console.log(`  Email: ${authUser.email}`);
    
    // Vérifier s'il existe déjà dans la collection users
    try {
      await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
      console.log('⚠️  L\'utilisateur existe déjà dans la collection users.');
      return;
    } catch (error) {
      // L'utilisateur n'existe pas, on peut le créer
      console.log('📝 L\'utilisateur n\'existe pas dans la collection users, création en cours...');
    }
    
    // Créer l'utilisateur dans la collection users avec l'ID spécifique
    const newUserDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      userId, // Utiliser le même ID que l'authentification
      {
        fullName: authUser.name,
        email: authUser.email,
        role: 'seller', // Rôle par défaut
        storeId: '686af0b20011ff9382c8' // Store par défaut (même que Marielle ecqm19)
      }
    );
    
    console.log('✅ Utilisateur créé avec succès dans la collection users:');
    console.log(`  ID: ${newUserDoc.$id}`);
    console.log(`  Full Name: ${newUserDoc.fullName}`);
    console.log(`  Email: ${newUserDoc.email}`);
    console.log(`  Role: ${newUserDoc.role}`);
    console.log(`  Store ID: ${newUserDoc.storeId}`);
    
    // Tester la génération de user_seller
    const { generateUserSeller } = require('../src/lib/utils/sellerUtils');
    const userSeller = generateUserSeller(newUserDoc.fullName);
    console.log(`\n🏷️  user_seller généré: "${userSeller}" (${userSeller.length} caractères)`);
    console.log(`🏷️  user_seller tronqué (9 chars): "${userSeller.substring(0, 9)}"`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message);
  }
}

// Utiliser l'ID de l'utilisateur manquant
const missingUserId = '688987f7003216df6426';
syncMissingUser(missingUserId);