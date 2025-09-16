/**
 * Script pour vérifier la collection users dans la base de données
 */

const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { DATABASE_ID, PROJECT_ID, ENDPOINT, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkUsersCollection() {
  try {
    console.log('🔍 Vérification de la collection users...');
    console.log('Database ID:', DATABASE_ID);
    console.log('Collection ID:', COLLECTIONS.USERS);
    
    // Lister tous les documents de la collection users
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [
        Query.limit(100)
      ]
    );
    
    console.log(`\n✅ Collection users trouvée avec ${response.total} document(s):\n`);
    
    response.documents.forEach((user, index) => {
      console.log(`Utilisateur ${index + 1}:`);
      console.log(`  ID: ${user.$id}`);
      console.log(`  Full Name: ${user.fullName || 'N/A'}`);
      console.log(`  Email: ${user.email || 'N/A'}`);
      console.log(`  Role: ${user.role || 'N/A'}`);
      console.log(`  Store ID: ${user.storeId || 'N/A'}`);
      console.log('');
    });
    
    // Vérifier spécifiquement l'utilisateur 688987f7003216df6426
    const targetUserId = '688987f7003216df6426';
    console.log(`🔍 Recherche spécifique de l'utilisateur ${targetUserId}...`);
    
    try {
      const targetUser = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        targetUserId
      );
      
      console.log('✅ Utilisateur trouvé:');
      console.log(`  ID: ${targetUser.$id}`);
      console.log(`  Full Name: '${targetUser.fullName}'`);
      console.log(`  Email: ${targetUser.email}`);
      console.log(`  Role: ${targetUser.role}`);
      
    } catch (error) {
      console.log(`❌ Utilisateur ${targetUserId} non trouvé dans la collection users:`, error.message);
      console.log('\n💡 Cet utilisateur existe dans l\'authentification Appwrite mais pas dans la collection users de la base de données.');
      console.log('   C\'est pourquoi le système utilise le fallback USER_6889.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la collection users:', error.message);
  }
}

checkUsersCollection();

