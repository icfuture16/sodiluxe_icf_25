/**
 * Script pour lister les ventes existantes dans la base de données
 * Utile pour vérifier les IDs de vente valides
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

// Fonction pour lister les ventes
async function listSales() {
  try {
    console.log('📥 Récupération des ventes...');
    console.log(`   - Database ID: ${DATABASE_ID}`);
    console.log(`   - Collection ID: ${COLLECTIONS.SALES}`);
    console.log('');
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SALES,
      []
    );
    
    console.log(`✅ ${response.documents.length} ventes trouvées:`);
    console.log('');
    
    response.documents.forEach((sale, index) => {
      console.log(`${index + 1}. ID: ${sale.$id}`);
      console.log(`   - Date: ${sale.saleDate || sale.$createdAt}`);
      console.log(`   - Client ID: ${sale.clientId || 'N/A'}`);
      console.log(`   - Vendeur ID: ${sale.userId || sale.sellerId || 'N/A'}`);
      console.log(`   - Montant: ${sale.totalAmount || 'N/A'}`);
      console.log(`   - Statut: ${sale.status || 'N/A'}`);
      console.log(`   - user_seller: ${sale.user_seller || 'N/A'}`);
      console.log('');
    });
    
    return response.documents;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des ventes:', error.message);
    throw error;
  }
}

// Fonction pour vérifier un ID spécifique
async function checkSaleId(saleId) {
  try {
    console.log(`🔍 Vérification de l'ID de vente: ${saleId}`);
    
    const sale = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.SALES,
      saleId
    );
    
    console.log('✅ Vente trouvée:');
    console.log(`   - ID: ${sale.$id}`);
    console.log(`   - Date: ${sale.saleDate || sale.$createdAt}`);
    console.log(`   - Client ID: ${sale.clientId || 'N/A'}`);
    console.log(`   - Vendeur ID: ${sale.userId || sale.sellerId || 'N/A'}`);
    console.log(`   - Montant: ${sale.totalAmount || 'N/A'}`);
    console.log(`   - Statut: ${sale.status || 'N/A'}`);
    console.log(`   - user_seller: ${sale.user_seller || 'N/A'}`);
    
    return sale;
  } catch (error) {
    console.error(`❌ Vente avec l'ID ${saleId} non trouvée:`, error.message);
    return null;
  }
}

// Fonction principale
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
      // Vérifier un ID spécifique
      const saleId = args[0];
      await checkSaleId(saleId);
    } else {
      // Lister toutes les ventes
      await listSales();
    }
  } catch (error) {
    console.error('💥 Erreur:', error.message);
    process.exit(1);
  }
}

// Exporter les fonctions pour utilisation dans d'autres scripts
module.exports = {
  listSales,
  checkSaleId
};

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

