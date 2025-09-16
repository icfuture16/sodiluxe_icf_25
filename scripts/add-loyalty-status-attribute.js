const { Client, Databases, Permission, Role } = require('node-appwrite');

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

async function addLoyaltyStatusAttribute() {
  try {
    console.log('Ajout de l\'attribut loyaltyStatus à la collection clients...');
    
    // Vérifier si l'attribut existe déjà
    try {
      const collection = await databases.getCollection(DATABASE_ID, COLLECTIONS.CLIENTS);
      const existingAttribute = collection.attributes.find(attr => attr.key === 'loyaltyStatus');
      
      if (existingAttribute) {
        console.log('L\'attribut loyaltyStatus existe déjà.');
        return;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la collection:', error);
      throw error;
    }

    // Ajouter l'attribut loyaltyStatus
    await databases.createEnumAttribute(
      DATABASE_ID, 
      COLLECTIONS.CLIENTS, 
      'loyaltyStatus', 
      ['bronze', 'argent', 'or'], 
      false, 
      'bronze'
    );

    console.log('Attribut loyaltyStatus ajouté avec succès à la collection clients!');
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'attribut loyaltyStatus:', error);
    throw error;
  }
}

// Exécuter la fonction
addLoyaltyStatusAttribute();

