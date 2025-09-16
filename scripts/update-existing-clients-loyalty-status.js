const { Client, Databases, Query } = require('node-appwrite');

// Constantes Appwrite
const DATABASE_ID = '68bf1e7b003c6b340d6e';
const COLLECTIONS = {
  CLIENTS: 'clients'
};

// Configuration Appwrite
const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68bf1c29001d20f7444d')
  .setKey('standard_7c860836bcc01137b6f2bac843cb0996bdb7d67d58e613ee92b26122296b0b7b42da7bbee2748b0b15c86f672a56e59ef5ebc21946625940759df6dc5396d43d0fb84c7535b3789f0ff54bc125305d06936ea9cbefec68dd0714dac4889fbeb630687ad2873aea1050bec1140c600a89d14e6cdfdffc6203509b14de4d897ad3');

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

