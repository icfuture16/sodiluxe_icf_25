const { Client, Databases } = require('node-appwrite');

// Configuration Appwrite
const client = new Client();
client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6856f8aa00281cb47665')
  .setKey('standard_4c24e91366984ffd2c2c09a0ed2d3527382fde636b7ea60c867a10467fb58ec942be378668988ad3cdc4993bf2f6839e75a7467b0771f3c8e899d0f1b3b063946c7ef195972d58310ccbbf899423fdd94ceda4b1e3a88c8c691d716e105890966f552b942cdf76360ae311305dae2559d92afe1ab64367f927af580263d63dc2');

const databases = new Databases(client);
const DATABASE_ID = '68599714002eef233c16';
const CLIENTS_COLLECTION_ID = 'clients';

async function listLoyaltyCardNumbers() {
  try {
    console.log('Récupération des numéros de carte de fidélité...');
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      CLIENTS_COLLECTION_ID,
      []
    );
    
    console.log('\n=== NUMÉROS DE CARTE DE FIDÉLITÉ ===');
    response.documents.forEach((client, index) => {
      console.log(`${index + 1}. ${client.fullName} - Carte: ${client.loyaltyCardNumber || 'Non attribué'}`);
    });
    
    console.log(`\nTotal: ${response.documents.length} clients`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le script
if (require.main === module) {
  listLoyaltyCardNumbers();
}

module.exports = { listLoyaltyCardNumbers };