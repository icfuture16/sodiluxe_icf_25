/**
 * Script pour vérifier le schéma de la collection users
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

async function checkUsersSchema() {
  try {
    console.log('🔍 Vérification du schéma de la collection users...');
    
    // Récupérer les informations de la collection
    const collection = await databases.getCollection(DATABASE_ID, COLLECTIONS.USERS);
    
    console.log(`\n✅ Collection: ${collection.name}`);
    console.log(`ID: ${collection.$id}`);
    console.log(`\nAttributs disponibles:`);
    
    collection.attributes.forEach((attr, index) => {
      console.log(`${index + 1}. ${attr.key}:`);
      console.log(`   Type: ${attr.type}`);
      console.log(`   Requis: ${attr.required}`);
      if (attr.size) console.log(`   Taille: ${attr.size}`);
      if (attr.default !== undefined) console.log(`   Défaut: ${attr.default}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du schéma:', error.message);
  }
}

checkUsersSchema();

