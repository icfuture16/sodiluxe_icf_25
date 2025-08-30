/**
 * Script pour vérifier les détails d'une vente spécifique
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

async function checkSaleDetails(saleId) {
  try {
    console.log(`🔍 Vérification de la vente ID: ${saleId}`);
    
    const sale = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.SALES,
      saleId
    );
    
    console.log('📄 Détails de la vente:');
    console.log(`- ID: ${sale.$id}`);
    console.log(`- Client ID: ${sale.clientId}`);
    console.log(`- Store ID: ${sale.storeId}`);
    console.log(`- User ID (vendeur): ${sale.userId}`);
    console.log(`- user_seller: ${sale.user_seller || 'Non défini'}`);
    console.log(`- Total: ${sale.totalAmount}`);
    console.log(`- Date: ${sale.saleDate}`);
    console.log(`- Status: ${sale.status}`);
    
    // Afficher tous les champs disponibles
    console.log('\n📋 Tous les champs disponibles:');
    Object.keys(sale).forEach(key => {
      if (!key.startsWith('$')) {
        console.log(`- ${key}: ${sale[key]}`);
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération de la vente:`, error.message);
  }
}

// Récupérer l'ID de la vente depuis les arguments de ligne de commande
const saleId = process.argv[2];

if (!saleId) {
  console.error('❌ Veuillez fournir un ID de vente');
  console.log('Usage: node check-sale-details.js <sale-id>');
  process.exit(1);
}

checkSaleDetails(saleId);