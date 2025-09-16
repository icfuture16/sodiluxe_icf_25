const { Client, Databases } = require('node-appwrite');

// Configuration Appwrite avec les vraies valeurs
const client = new Client();
client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68bf1c29001d20f7444d')
  .setKey('standard_7c860836bcc01137b6f2bac843cb0996bdb7d67d58e613ee92b26122296b0b7b42da7bbee2748b0b15c86f672a56e59ef5ebc21946625940759df6dc5396d43d0fb84c7535b3789f0ff54bc125305d06936ea9cbefec68dd0714dac4889fbeb630687ad2873aea1050bec1140c600a89d14e6cdfdffc6203509b14de4d897ad3');

const databases = new Databases(client);
const DATABASE_ID = 'default';
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

