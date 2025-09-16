const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// IDs de configuration
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const RESERVATION_ITEMS_COLLECTION_ID = 'reservation_items';

async function addDiscountAttribute() {
  try {
    console.log('Ajout de l\'attribut discountPercentage à la collection reservation_items...');
    
    // Ajouter l'attribut discountPercentage
    await databases.createFloatAttribute(
      DATABASE_ID,
      RESERVATION_ITEMS_COLLECTION_ID,
      'discountPercentage',
      false, // non requis
      0,     // valeur par défaut
      100    // valeur maximale
    );
    
    console.log('Attribut discountPercentage ajouté avec succès!');
  } catch (error) {
    if (error.code === 409) {
      console.log('L\'attribut discountPercentage existe déjà.');
    } else {
      console.error('Erreur lors de l\'ajout de l\'attribut:', error);
      throw error;
    }
  }
}

// Exécuter la fonction
addDiscountAttribute()
  .then(() => {
    console.log('Script terminé avec succès.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur dans le script:', error);
    process.exit(1);
  });

