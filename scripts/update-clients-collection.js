const { Client, Databases, ID, Permission, Role } = require('node-appwrite');
require('dotenv').config();
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Vérification des variables d'environnement requises
if (!process.env.APPWRITE_ENDPOINT || !process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
  console.error('Erreur: Variables d\'environnement manquantes.');
  console.error('Veuillez définir APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID et APPWRITE_API_KEY dans le fichier .env');
  process.exit(1);
}

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY); // Clé API avec permissions suffisantes

const databases = new Databases(client);

// Collection clients
const CLIENTS_COLLECTION = COLLECTIONS.CLIENTS;

// Fonction principale
async function updateClientsCollection() {
  try {
    console.log('Mise à jour de la collection clients...');
    console.log(`Utilisation de la base de données: ${DATABASE_ID}`);
    
    // Vérifier si la collection existe
    try {
      await databases.getCollection(DATABASE_ID, CLIENTS_COLLECTION);
      console.log(`Collection '${CLIENTS_COLLECTION}' trouvée.`);
    } catch (error) {
      if (error.code === 404) {
        console.error(`Collection '${CLIENTS_COLLECTION}' n'existe pas.`);
        process.exit(1);
      } else {
        throw error;
      }
    }

    // Ajouter l'attribut segment
    try {
      console.log('Ajout de l\'attribut "segment"...');
      await databases.createEnumAttribute(
        DATABASE_ID,
        CLIENTS_COLLECTION,
        'segment',
        ['premium', 'gold', 'silver', 'bronze'],
        false // Attribut non requis
      );
      console.log('Attribut "segment" ajouté avec succès.');
    } catch (error) {
      if (error.code === 409) {
        console.log('L\'attribut "segment" existe déjà.');
      } else {
        console.error('Erreur lors de l\'ajout de l\'attribut "segment":', error);
        throw error;
      }
    }

    // Ajouter l'attribut vipStatus s'il n'existe pas
    try {
      console.log('Ajout de l\'attribut "vipStatus"...');
      await databases.createBooleanAttribute(
        DATABASE_ID,
        CLIENTS_COLLECTION,
        'vipStatus',
        false // Attribut non requis
      );
      console.log('Attribut "vipStatus" ajouté avec succès.');
    } catch (error) {
      if (error.code === 409) {
        console.log('L\'attribut "vipStatus" existe déjà.');
      } else {
        console.error('Erreur lors de l\'ajout de l\'attribut "vipStatus":', error);
        throw error;
      }
    }

    // Ajouter l'attribut preferredStore s'il n'existe pas
    try {
      console.log('Ajout de l\'attribut "preferredStore"...');
      await databases.createStringAttribute(
        DATABASE_ID,
        CLIENTS_COLLECTION,
        'preferredStore',
        36, // Longueur maximale (ID de magasin)
        false // Optionnel
      );
      console.log('Attribut "preferredStore" ajouté avec succès.');
    } catch (error) {
      if (error.code === 409) {
        console.log('L\'attribut "preferredStore" existe déjà.');
      } else {
        console.error('Erreur lors de l\'ajout de l\'attribut "preferredStore":', error);
        throw error;
      }
    }

    // Ajouter l'attribut lastPurchase s'il n'existe pas
    try {
      console.log('Ajout de l\'attribut "lastPurchase"...');
      await databases.createStringAttribute(
        DATABASE_ID,
        CLIENTS_COLLECTION,
        'lastPurchase',
        30, // Longueur maximale pour une date
        false // Optionnel
      );
      console.log('Attribut "lastPurchase" ajouté avec succès.');
    } catch (error) {
      if (error.code === 409) {
        console.log('L\'attribut "lastPurchase" existe déjà.');
      } else {
        console.error('Erreur lors de l\'ajout de l\'attribut "lastPurchase":', error);
        throw error;
      }
    }

    // Ajouter l'attribut firstPurchase s'il n'existe pas
    try {
      console.log('Ajout de l\'attribut "firstPurchase"...');
      await databases.createStringAttribute(
        DATABASE_ID,
        CLIENTS_COLLECTION,
        'firstPurchase',
        30, // Longueur maximale pour une date
        false // Optionnel
      );
      console.log('Attribut "firstPurchase" ajouté avec succès.');
    } catch (error) {
      if (error.code === 409) {
        console.log('L\'attribut "firstPurchase" existe déjà.');
      } else {
        console.error('Erreur lors de l\'ajout de l\'attribut "firstPurchase":', error);
        throw error;
      }
    }

    // Ajouter l'attribut purchaseFrequency s'il n'existe pas
    try {
      console.log('Ajout de l\'attribut "purchaseFrequency"...');
      await databases.createFloatAttribute(
        DATABASE_ID,
        CLIENTS_COLLECTION,
        'purchaseFrequency',
        false // Optionnel
      );
      console.log('Attribut "purchaseFrequency" ajouté avec succès.');
    } catch (error) {
      if (error.code === 409) {
        console.log('L\'attribut "purchaseFrequency" existe déjà.');
      } else {
        console.error('Erreur lors de l\'ajout de l\'attribut "purchaseFrequency":', error);
        throw error;
      }
    }

    // Ajouter l'attribut preferredCategories s'il n'existe pas
    try {
      console.log('Ajout de l\'attribut "preferredCategories"...');
      await databases.createStringAttribute(
        DATABASE_ID,
        CLIENTS_COLLECTION,
        'preferredCategories',
        255, // Longueur maximale
        false, // Optionnel
        null, // Valeur par défaut
        true // Array
      );
      console.log('Attribut "preferredCategories" ajouté avec succès.');
    } catch (error) {
      if (error.code === 409) {
        console.log('L\'attribut "preferredCategories" existe déjà.');
      } else {
        console.error('Erreur lors de l\'ajout de l\'attribut "preferredCategories":', error);
        throw error;
      }
    }

    // Ajouter l'attribut tags s'il n'existe pas
    try {
      console.log('Ajout de l\'attribut "tags"...');
      await databases.createStringAttribute(
        DATABASE_ID,
        CLIENTS_COLLECTION,
        'tags',
        255, // Longueur maximale
        false, // Optionnel
        null, // Valeur par défaut
        true // Array
      );
      console.log('Attribut "tags" ajouté avec succès.');
    } catch (error) {
      if (error.code === 409) {
        console.log('L\'attribut "tags" existe déjà.');
      } else {
        console.error('Erreur lors de l\'ajout de l\'attribut "tags":', error);
        throw error;
      }
    }

    console.log('Mise à jour de la collection clients terminée avec succès!');
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la collection clients:', error);
  }
}

// Exécuter la fonction principale
updateClientsCollection();