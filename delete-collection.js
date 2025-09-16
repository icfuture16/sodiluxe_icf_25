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
const logFile = path.join(__dirname, 'appwrite-collection-deletion.log');
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
    
    if (!response.ok) {
      // Gestion des erreurs 404 pour la suppression (si la collection n'existe pas)
      if (response.status === 404 && method === 'DELETE') {
        log(`La ressource n'existe pas (404), considéré comme succès pour la suppression.`);
        return { success: true, message: 'Resource not found' };
      }
      
      const data = await response.json().catch(() => ({ message: 'Could not parse error response' }));
      log(`Erreur API (${response.status}): ${JSON.stringify(data)}`);
      throw new Error(`API Error (${response.status}): ${data.message || JSON.stringify(data)}`);
    }
    
    // Pour les requêtes DELETE, pas besoin de parser la réponse
    if (method === 'DELETE') {
      return { success: true };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    log(`Erreur de requête: ${error.message}`);
    throw error;
  }
}

// Fonction pour supprimer la collection
async function deleteCollection() {
  try {
    log('Suppression de la collection "objectives"...');
    
    await appwriteRequest(
      `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}`,
      'DELETE'
    );
    
    log('Collection "objectives" supprimée avec succès ou n\'existait pas.');
    return true;
  } catch (error) {
    log(`Erreur lors de la suppression: ${error.message}`);
    return false;
  }
}

// Exécuter le script
deleteCollection()
  .then(() => {
    log('Processus de suppression terminé.');
  })
  .catch(error => {
    log(`Erreur: ${error.message}`);
    process.exit(1);
  });

