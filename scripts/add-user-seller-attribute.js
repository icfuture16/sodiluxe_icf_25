/**
 * Script pour ajouter l'attribut user_seller à la collection sales
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

// IDs des collections
const SALES_COLLECTION_ID = COLLECTIONS.SALES;

// Fonction principale
async function addUserSellerAttribute() {
  try {
    console.log('🚀 Ajout de l\'attribut user_seller à la collection sales');
    console.log('📋 Configuration:');
    console.log(`   - Endpoint: ${ENDPOINT}`);
    console.log(`   - Projet: ${PROJECT_ID}`);
    console.log(`   - Base de données: ${DATABASE_ID}`);
    console.log(`   - Collection ventes: ${SALES_COLLECTION_ID}`);
    
    // Vérification des variables d'environnement
    if (!process.env.APPWRITE_API_KEY) {
      console.error('❌ Variable d\'environnement APPWRITE_API_KEY manquante. Veuillez vérifier votre fichier .env.local');
      process.exit(1);
    }
    
    console.log('\n📝 Ajout de l\'attribut user_seller...');
    
    // Ajouter l'attribut user_seller (string, optionnel, max 9 caractères)
    const attribute = await databases.createStringAttribute(
      DATABASE_ID,
      SALES_COLLECTION_ID,
      'user_seller',
      9,        // taille maximale
      false,    // non requis
      null,     // pas de valeur par défaut
      false     // pas de tableau
    );
    
    console.log('✅ Attribut user_seller ajouté avec succès!');
    console.log(`   - Clé: ${attribute.key}`);
    console.log(`   - Type: ${attribute.type}`);
    console.log(`   - Taille: ${attribute.size}`);
    console.log(`   - Requis: ${attribute.required}`);
    
    console.log('\n⏳ Attente de 5 secondes pour que l\'attribut soit disponible...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n✨ L\'attribut user_seller est maintenant disponible dans la collection sales!');
    console.log('Vous pouvez maintenant exécuter le script update-existing-sales-user-seller.js');
    
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  L\'attribut user_seller existe déjà dans la collection sales');
    } else {
      console.error('❌ Erreur lors de l\'ajout de l\'attribut:', error.message);
      throw error;
    }
  }
}

// Exécution du script
addUserSellerAttribute()
  .then(() => {
    console.log('\n✨ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Échec du script:', error.message);
    process.exit(1);
  });

module.exports = {
  addUserSellerAttribute
};