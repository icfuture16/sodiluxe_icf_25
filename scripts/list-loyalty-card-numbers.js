const { Client, Databases } = require('node-appwrite');

// Configuration Appwrite
const client = new Client();
client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68bf1c29001d20f7444d')
  .setKey('standard_7c860836bcc01137b6f2bac843cb0996bdb7d67d58e613ee92b26122296b0b7b42da7bbee2748b0b15c86f672a56e59ef5ebc21946625940759df6dc5396d43d0fb84c7535b3789f0ff54bc125305d06936ea9cbefec68dd0714dac4889fbeb630687ad2873aea1050bec1140c600a89d14e6cdfdffc6203509b14de4d897ad3');

const databases = new Databases(client);
const DATABASE_ID = '68bf1e7b003c6b340d6e';
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

