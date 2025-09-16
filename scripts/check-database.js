/**
 * Script pour vérifier si la base de données existe
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Databases } = require('node-appwrite');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// ID de la base de données importé depuis appwrite-config.js

// Fonction principale
async function checkDatabase() {
  try {
    console.log('Vérification de la base de données Appwrite...');
    console.log(`ID de la base de données: ${DATABASE_ID}`);
    
    try {
      // Récupérer la liste des bases de données au lieu d'essayer d'en obtenir une spécifique
      const databasesList = await databases.list();
      
      console.log(`Nombre total de bases de données: ${databasesList.total}`);
      
      // Vérifier si notre base de données existe dans la liste
      const foundDatabase = databasesList.databases.find(db => db.$id === DATABASE_ID);
      
      if (foundDatabase) {
        console.log(`✅ La base de données '${DATABASE_ID}' existe:`);
        console.log(`   - Nom: ${foundDatabase.name}`);
      } else {
        console.log(`❌ La base de données '${DATABASE_ID}' n'existe pas dans la liste des bases de données.`);
        console.log('Bases de données disponibles:');
        databasesList.databases.forEach(db => {
          console.log(`   - ${db.name} (${db.$id})`);
        });
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des bases de données:`, error);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter la fonction principale
checkDatabase();

