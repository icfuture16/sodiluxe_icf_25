const { Client, Databases, Query } = require('node-appwrite');

// Constantes Appwrite
const DATABASE_ID = '68599714002eef233c16';
const COLLECTIONS = {
  CLIENTS: 'clients'
};

// Configuration Appwrite
const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6856f8aa00281cb47665')
  .setKey('standard_4c24e91366984ffd2c2c09a0ed2d3527382fde636b7ea60c867a10467fb58ec942be378668988ad3cdc4993bf2f6839e75a7467b0771f3c8e899d0f1b3b063946c7ef195972d58310ccbbf899423fdd94ceda4b1e3a88c8c691d716e105890966f552b942cdf76360ae311305dae2559d92afe1ab64367f927af580263d63dc2');

const databases = new Databases(client);

async function updateExistingClientsLoyaltyStatus() {
  try {
    console.log('Mise à jour du statut de fidélité pour tous les clients existants...');
    
    // Récupérer tous les clients
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CLIENTS,
      [
        Query.limit(100) // Traiter par batch de 100
      ]
    );

    console.log(`Trouvé ${response.documents.length} clients à mettre à jour.`);

    // Mettre à jour chaque client
    for (const client of response.documents) {
      try {
        // Déterminer le statut basé sur les points de fidélité
        let loyaltyStatus = 'bronze';
        const loyaltyPoints = client.loyaltyPoints || 0;
        
        if (loyaltyPoints >= 1000) {
          loyaltyStatus = 'or';
        } else if (loyaltyPoints >= 500) {
          loyaltyStatus = 'argent';
        }

        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.CLIENTS,
          client.$id,
          {
            loyaltyStatus: loyaltyStatus
          }
        );

        console.log(`Client ${client.fullName} (${client.$id}) mis à jour avec le statut: ${loyaltyStatus}`);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du client ${client.$id}:`, error);
      }
    }

    console.log('Mise à jour terminée!');
  } catch (error) {
    console.error('Erreur lors de la mise à jour des clients:', error);
    throw error;
  }
}

// Exécuter la fonction
updateExistingClientsLoyaltyStatus();