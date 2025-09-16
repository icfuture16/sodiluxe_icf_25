// Script pour ajouter l'attribut discountPercentage à la collection reservation_items
// Exécuter avec: node add-discount-percentage-attribute.js

const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

// Configuration Appwrite
const DATABASE_ID = '68bf1e7b003c6b340d6e';
const COLLECTION_ID = 'reservation_items';
const PROJECT_ID = '68bf1c29001d20f7444d';
const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.error('APPWRITE_API_KEY non trouvée dans les variables d\'environnement');
  process.exit(1);
}

// Initialiser le client Appwrite
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function addDiscountPercentageAttribute() {
  try {
    console.log('Ajout de l\'attribut discountPercentage à la collection reservation_items...');
    
    // Ajouter l'attribut discountPercentage (optionnel, valeur par défaut 0, max 100)
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'discountPercentage',
      false, // non requis (optionnel)
      0,     // valeur par défaut
      100    // valeur maximale
    );
    
    console.log('Attribut discountPercentage ajouté avec succès à la collection reservation_items!');
    
  } catch (error) {
    if (error.code === 409) {
      console.log('L\'attribut discountPercentage existe déjà dans la collection.');
    } else {
      console.error('Erreur lors de l\'ajout de l\'attribut discountPercentage:', error);
      throw error;
    }
  }
}

// Exécuter le script
addDiscountPercentageAttribute()
  .then(() => {
    console.log('Script terminé avec succès.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  });

