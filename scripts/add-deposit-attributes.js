const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const RESERVATIONS_COLLECTION_ID = 'reservations';

async function addDepositAttributes() {
  try {
    console.log('Ajout des attributs depositAmount et depositPaid à la collection reservations...');
    
    // Ajouter l'attribut depositAmount (optionnel)
    try {
      await databases.createFloatAttribute(
        DATABASE_ID,
        RESERVATIONS_COLLECTION_ID,
        'depositAmount',
        false, // non requis
        0 // valeur par défaut
      );
      console.log('Attribut depositAmount ajouté avec succès.');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Attribut depositAmount existe déjà.');
      } else {
        throw error;
      }
    }
    
    // Ajouter l'attribut depositPaid (non requis)
    try {
      await databases.createBooleanAttribute(
        DATABASE_ID,
        RESERVATIONS_COLLECTION_ID,
        'depositPaid',
        false // non requis
      );
      console.log('Attribut depositPaid ajouté avec succès.');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Attribut depositPaid existe déjà.');
      } else {
        throw error;
      }
    }
    
    console.log('Tous les attributs de dépôt ont été ajoutés avec succès!');
  } catch (error) {
    console.error('Erreur lors de l\'ajout des attributs:', error);
    process.exit(1);
  }
}

// Exécuter le script
addDepositAttributes();

