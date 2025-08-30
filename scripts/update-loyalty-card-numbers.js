const { Client, Databases } = require('node-appwrite');

// Configuration Appwrite avec les vraies valeurs
const client = new Client();
client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6856f8aa00281cb47665')
  .setKey('standard_4c24e91366984ffd2c2c09a0ed2d3527382fde636b7ea60c867a10467fb58ec942be378668988ad3cdc4993bf2f6839e75a7467b0771f3c8e899d0f1b3b063946c7ef195972d58310ccbbf899423fdd94ceda4b1e3a88c8c691d716e105890966f552b942cdf76360ae311305dae2559d92afe1ab64367f927af580263d63dc2');

const databases = new Databases(client);
const DATABASE_ID = '68599714002eef233c16';
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