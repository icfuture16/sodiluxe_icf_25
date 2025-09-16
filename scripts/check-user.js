/**
 * Script pour vérifier l'existence d'un utilisateur
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { DATABASE_ID, PROJECT_ID, ENDPOINT, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Fonction pour vérifier un utilisateur
async function checkUser(userId) {
  try {
    console.log(`🔍 Vérification de l'utilisateur ID: ${userId}`);
    
    const user = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      userId
    );
    
    console.log('✅ Utilisateur trouvé:');
    console.log(`   - ID: ${user.$id}`);
    console.log(`   - Nom: ${user.fullName || user.name || 'N/A'}`);
    console.log(`   - Email: ${user.email || 'N/A'}`);
    console.log(`   - Rôle: ${user.role || 'N/A'}`);
    
    return user;
  } catch (error) {
    console.error(`❌ Utilisateur avec l'ID ${userId} non trouvé:`, error.message);
    return null;
  }
}

// Fonction principale
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.error('❌ Veuillez fournir un ID utilisateur');
      console.log('Usage: node check-user.js <userId>');
      process.exit(1);
    }
    
    const userId = args[0];
    await checkUser(userId);
  } catch (error) {
    console.error('💥 Erreur:', error.message);
    process.exit(1);
  }
}

// Exporter la fonction pour utilisation dans d'autres scripts
module.exports = {
  checkUser
};

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

