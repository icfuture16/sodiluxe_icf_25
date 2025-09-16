require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Configuration
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '68bf1e7b003c6b340d6e';
const COLLECTION_ID = 'objectives';

// Journal
const logFile = path.join(__dirname, 'appwrite-collection-creation.log');
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Fonction pour les requêtes à l'API Appwrite
async function appwriteRequest(endpoint, method = 'GET', body = null) {
  const url = `${APPWRITE_ENDPOINT}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': APPWRITE_PROJECT_ID,
    'X-Appwrite-Key': APPWRITE_API_KEY
  };

  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  };

  log(`Appel API ${method} vers ${url}`);
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      log(`Erreur API (${response.status}): ${JSON.stringify(data)}`);
      throw new Error(`API Error (${response.status}): ${data.message || JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    log(`Erreur de requête: ${error.message}`);
    throw error;
  }
}

// Fonction pour vérifier si la collection existe
async function checkCollectionExists() {
  try {
    await appwriteRequest(`/databases/${DATABASE_ID}/collections/${COLLECTION_ID}`);
    return true;
  } catch (error) {
    if (error.message.includes('404')) {
      return false;
    }
    throw error;
  }
}

// Création de la collection
async function createCollection() {
  const exists = await checkCollectionExists();
  
  if (exists) {
    log('La collection "objectives" existe déjà.');
    return;
  }
  
  log('Création de la collection "objectives"...');
  
  // 1. Créer la collection
  const collection = await appwriteRequest(
    `/databases/${DATABASE_ID}/collections`,
    'POST',
    {
      collectionId: COLLECTION_ID,
      name: 'Objectifs',
      permissions: [
        "read(\"any\")",
        "create(\"team:admin\")",
        "update(\"team:admin\")",
        "delete(\"team:admin\")"
      ]
    }
  );
  
  log(`Collection créée avec succès: ${collection.$id}`);
  
  // 2. Créer l'attribut utilisateurId
  await appwriteRequest(
    `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/string`,
    'POST',
    {
      key: 'utilisateurId',
      size: 64,
      required: true
    }
  );
  log('Attribut "utilisateurId" créé avec succès.');
  
  // 3. Créer l'attribut moisEnCours
  await appwriteRequest(
    `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/string`,
    'POST',
    {
      key: 'moisEnCours',
      size: 30,
      required: true
    }
  );
  log('Attribut "moisEnCours" créé avec succès.');
  
  // 4. Créer l'attribut dateCreation
  await appwriteRequest(
    `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/datetime`,
    'POST',
    {
      key: 'dateCreation',
      required: false
    }
  );
  log('Attribut "dateCreation" créé avec succès.');
  
  // 5. Créer l'attribut financier comme string (contenant du JSON)
  await appwriteRequest(
    `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/string`,
    'POST',
    {
      key: 'financier',
      size: 16384,  // Taille suffisante pour contenir un objet JSON
      required: false,
      default: '{}'
    }
  );
  log('Attribut "financier" créé avec succès (comme string)');
  
  // 6. Créer l'attribut taches comme string (contenant du JSON)
  await appwriteRequest(
    `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/string`,
    'POST',
    {
      key: 'taches',
      size: 16384,  // Taille suffisante pour contenir un tableau d'objets JSON
      required: false,
      default: '[]'
    }
  );
  log('Attribut "taches" créé avec succès (comme string)');
  
  // 7. Créer des index pour les requêtes
  // Attendre un peu pour s'assurer que les attributs sont bien créés
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    await appwriteRequest(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/indexes`,
      'POST',
      {
        key: 'index_utilisateur',
        type: 'key',
        attributes: ['utilisateurId']
      }
    );
    log('Index sur "utilisateurId" créé avec succès.');
  } catch (error) {
    log(`Erreur lors de la création de l'index utilisateur: ${error.message}`);
  }
  
  try {
    await appwriteRequest(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/indexes`,
      'POST',
      {
        key: 'index_mois',
        type: 'key',
        attributes: ['moisEnCours']
      }
    );
    log('Index sur "moisEnCours" créé avec succès.');
  } catch (error) {
    log(`Erreur lors de la création de l'index mois: ${error.message}`);
  }
  
  log('Collection "objectives" et ses attributs créés avec succès.');
}

// Exécuter le script principal
createCollection()
  .then(() => {
    log('Processus terminé avec succès.');
  })
  .catch(error => {
    log(`Erreur: ${error.message}`);
    console.error('Erreur détaillée:', error);
    process.exit(1);
  });

