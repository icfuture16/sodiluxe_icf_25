const { Client, Databases, Permission, Role } = require('node-appwrite');

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