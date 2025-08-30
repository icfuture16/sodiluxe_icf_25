/**
 * Script pour créer un utilisateur dans la collection users avec un ID unique
 * et tester la génération de user_seller
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

async function createUserMapping(authUserId) {
  try {
    console.log(`🔍 Récupération de l'utilisateur ${authUserId} depuis l'authentification...`);
    
    // Récupérer l'utilisateur depuis l'authentification
    const authUser = await users.get(authUserId);
    console.log('✅ Utilisateur trouvé dans l\'authentification:');
    console.log(`  ID: ${authUser.$id}`);
    console.log(`  Nom: ${authUser.name}`);
    console.log(`  Email: ${authUser.email}`);
    
    // Créer l'utilisateur dans la collection users avec un ID unique
    const newUserId = ID.unique();
    console.log(`📝 Création de l'utilisateur avec l'ID unique: ${newUserId}`);
    
    const newUserDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      newUserId,
      {
        fullName: authUser.name,
        email: authUser.email,
        role: 'seller',
        storeId: '686af0b20011ff9382c8', // Store par défaut
        authUserId: authUserId // Mapper l'ID d'authentification
      }
    );
    
    console.log('✅ Utilisateur créé avec succès dans la collection users:');
    console.log(`  ID: ${newUserDoc.$id}`);
    console.log(`  Full Name: ${newUserDoc.fullName}`);
    console.log(`  Email: ${newUserDoc.email}`);
    console.log(`  Role: ${newUserDoc.role}`);
    console.log(`  Store ID: ${newUserDoc.storeId}`);
    console.log(`  Auth User ID: ${newUserDoc.authUserId}`);
    
    // Tester la génération de user_seller
    const { generateUserSeller } = require('../src/lib/utils/sellerUtils');
    const userSeller = generateUserSeller(newUserDoc.fullName);
    console.log(`\n🏷️  user_seller généré: "${userSeller}" (${userSeller.length} caractères)`);
    console.log(`🏷️  user_seller tronqué (9 chars): "${userSeller.substring(0, 9)}"`);
    
    console.log('\n💡 Note: Pour que cet utilisateur soit trouvé par l\'application,');
    console.log('   il faudra modifier la logique de recherche pour utiliser le champ authUserId.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
  }
}

// Utiliser l'ID de l'utilisateur manquant
const missingUserId = '688987f7003216df6426';
createUserMapping(missingUserId);