const { Client, Databases, ID, Permission, Role } = require('node-appwrite');
require('dotenv').config();

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// ID de la base de données
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const ACCESS_CODES = 'access_codes';

async function createAccessCodeCollection() {
  console.log('Création de la collection de codes d\'accès...');

  try {
    // Vérifier si la collection existe déjà
    try {
      const existingCollection = await databases.getCollection(DATABASE_ID, ACCESS_CODES);
      console.log(`La collection ${ACCESS_CODES} existe déjà.`);
      return;
    } catch (error) {
      // La collection n'existe pas, on continue pour la créer
      console.log('La collection n\'existe pas, création en cours...');
    }

    // Créer la collection
    await databases.createCollection(
      DATABASE_ID,
      ACCESS_CODES,
      'Codes d\'accès pour l\'inscription',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    console.log('Collection créée, ajout des attributs...');

    // Ajouter les attributs
    await databases.createStringAttribute(
      DATABASE_ID,
      ACCESS_CODES,
      'code',
      255,
      true
    );

    await databases.createStringAttribute(
      DATABASE_ID,
      ACCESS_CODES,
      'description',
      255,
      false
    );

    console.log('Attributs ajoutés, création de l\'index...');

    // Créer un index unique sur le code
    await databases.createIndex(
      DATABASE_ID,
      ACCESS_CODES,
      'code_unique',
      'unique',
      ['code']
    );

    console.log(`Collection ${ACCESS_CODES} créée avec succès.`);

    // Ajouter un document avec le code d'accès initial
    // Le code 'sodiluxe' encodé en hexadécimal
    const hexCode = Buffer.from('sodiluxe').toString('hex');
    
    await databases.createDocument(
      DATABASE_ID,
      ACCESS_CODES,
      ID.unique(),
      {
        code: hexCode,
        description: 'Code d\'accès initial pour l\'inscription'
      }
    );

    console.log(`Code d'accès initial créé: ${hexCode}`);

  } catch (error) {
    console.error('Erreur lors de la création de la collection de codes d\'accès:', error);
  }
}

// Exécuter la fonction
createAccessCodeCollection();

