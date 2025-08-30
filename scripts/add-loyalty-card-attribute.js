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

async function addLoyaltyCardAttribute() {
  try {
    console.log('Ajout de l\'attribut loyaltyCardNumber à la collection clients...');
    
    // Ajouter l'attribut loyaltyCardNumber
    await databases.createStringAttribute(
      DATABASE_ID,
      CLIENTS_COLLECTION_ID,
      'loyaltyCardNumber',
      255, // taille maximale
      false, // non requis
      null, // pas de valeur par défaut
      false // pas un tableau
    );
    
    console.log('✅ Attribut loyaltyCardNumber ajouté avec succès!');
    
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️ L\'attribut loyaltyCardNumber existe déjà.');
    } else {
      console.error('❌ Erreur lors de l\'ajout de l\'attribut:', error.message);
    }
  }
}

// Exécuter le script
addLoyaltyCardAttribute().then(() => {
  console.log('Script terminé.');
}).catch(error => {
  console.error('Erreur générale:', error);
});