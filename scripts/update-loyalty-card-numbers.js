const { Client, Databases } = require('node-appwrite');

// Configuration Appwrite avec les vraies valeurs
const client = new Client();
client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68bf1c29001d20f7444d')
  .setKey('standard_7c860836bcc01137b6f2bac843cb0996bdb7d67d58e613ee92b26122296b0b7b42da7bbee2748b0b15c86f672a56e59ef5ebc21946625940759df6dc5396d43d0fb84c7535b3789f0ff54bc125305d06936ea9cbefec68dd0714dac4889fbeb630687ad2873aea1050bec1140c600a89d14e6cdfdffc6203509b14de4d897ad3');

const databases = new Databases(client);
const DATABASE_ID = '68bf1e7b003c6b340d6e';
const CLIENTS_COLLECTION_ID = 'clients';

// Fonction pour générer un numéro de carte de fidélité
function generateLoyaltyCardNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${timestamp.substring(0, 4)}-${random}`;
}

async function updateClientsWithLoyaltyCardNumbers() {
  try {
    console.log('Récupération des clients sans numéro de carte de fidélité...');
    
    // Récupérer tous les clients
    const response = await databases.listDocuments(
      DATABASE_ID,
      CLIENTS_COLLECTION_ID,
      []
    );
    
    const clientsToUpdate = response.documents.filter(client => 
      !client.loyaltyCardNumber || client.loyaltyCardNumber.trim() === ''
    );
    
    console.log(`${clientsToUpdate.length} clients à mettre à jour sur ${response.documents.length} clients au total.`);
    
    if (clientsToUpdate.length === 0) {
      console.log('✅ Tous les clients ont déjà un numéro de carte de fidélité.');
      return;
    }
    
    // Mettre à jour chaque client
    for (const client of clientsToUpdate) {
      try {
        const loyaltyCardNumber = generateLoyaltyCardNumber();
        
        await databases.updateDocument(
          DATABASE_ID,
          CLIENTS_COLLECTION_ID,
          client.$id,
          {
            loyaltyCardNumber: loyaltyCardNumber
          }
        );
        
        console.log(`✅ Client mis à jour: ${client.fullName} - Carte: ${loyaltyCardNumber}`);
      } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour de ${client.fullName}:`, error.message);
      }
    }
    
    console.log('\n✅ Processus de mise à jour terminé!');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
if (require.main === module) {
  updateClientsWithLoyaltyCardNumbers();
}

module.exports = { updateClientsWithLoyaltyCardNumbers };

