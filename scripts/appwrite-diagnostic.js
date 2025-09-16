// Script de diagnostic complet pour Appwrite
require('dotenv').config();
const { Client, Account, Databases, ID } = require('node-appwrite');
const { DATABASE_ID, COLLECTIONS, PROJECT_ID, ENDPOINT } = require('./appwrite-config');

// Initialiser le client Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || PROJECT_ID);

const databases = new Databases(client);
const account = new Account(client);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Fonction pour afficher les messages avec couleur
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let color = colors.reset;
  let prefix = '';
  
  switch (type) {
    case 'success':
      color = colors.green;
      prefix = '✅ ';
      break;
    case 'error':
      color = colors.red;
      prefix = '❌ ';
      break;
    case 'warning':
      color = colors.yellow;
      prefix = '⚠️ ';
      break;
    case 'info':
      color = colors.blue;
      prefix = 'ℹ️ ';
      break;
    case 'step':
      color = colors.cyan;
      prefix = '🔍 ';
      break;
    case 'solution':
      color = colors.magenta;
      prefix = '💡 ';
      break;
  }
  
  console.log(`${color}${prefix}[${timestamp}] ${message}${colors.reset}`);
}

// Fonction pour vérifier les variables d'environnement
async function checkEnvironmentVariables() {
  log('Vérification des variables d\'environnement...', 'step');
  
  const requiredVars = {
    'NEXT_PUBLIC_APPWRITE_ENDPOINT': process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || ENDPOINT,
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || PROJECT_ID,
    'APPWRITE_API_KEY': process.env.APPWRITE_API_KEY,
    'APPWRITE_DATABASE_ID': process.env.APPWRITE_DATABASE_ID || DATABASE_ID
  };
  
  let allVarsPresent = true;
  
  for (const [name, value] of Object.entries(requiredVars)) {
    if (!value) {
      log(`Variable d'environnement manquante: ${name}`, 'error');
      log(`Solution: Ajoutez ${name} dans votre fichier .env.local`, 'solution');
      allVarsPresent = false;
    } else {
      log(`Variable d'environnement présente: ${name}`, 'success');
    }
  }
  
  return allVarsPresent;
}

// Fonction pour tester la création d'une session anonyme
async function testAnonymousSession() {
  log('Test de création d\'une session anonyme...', 'step');
  
  try {
    const session = await account.createAnonymousSession();
    log(`Session anonyme créée avec succès: ${session.$id}`, 'success');
    return session;
  } catch (error) {
    log(`Erreur lors de la création d\'une session anonyme: ${error.message}`, 'error');
    
    if (error.code === 401) {
      log('Solution: Vérifiez que le rôle "guests" a la permission "account" dans la console Appwrite', 'solution');
    } else if (error.code === 404) {
      log('Solution: Vérifiez que le projet et l\'endpoint sont correctement configurés', 'solution');
    } else {
      log('Solution: Vérifiez la configuration CORS dans la console Appwrite', 'solution');
    }
    
    return null;
  }
}

// Fonction pour tester l'accès aux collections
async function testCollectionAccess(session = null) {
  log('Test d\'accès aux collections...', 'step');
  
  for (const [name, id] of Object.entries(COLLECTIONS)) {
    try {
      await databases.listDocuments(DATABASE_ID, id, []);
      log(`Accès réussi à la collection ${name}`, 'success');
    } catch (error) {
      log(`Erreur d\'accès à la collection ${name}: ${error.message}`, 'error');
      
      if (error.code === 401) {
        log(`Solution: Vérifiez que le rôle "${session ? 'authenticated' : 'guests'}" a la permission "collections.read" pour la collection ${name}`, 'solution');
      } else if (error.code === 404) {
        log(`Solution: La collection ${name} n\'existe pas. Exécutez le script create-appwrite-collections.js`, 'solution');
      } else {
        log('Solution: Vérifiez la configuration de la base de données dans la console Appwrite', 'solution');
      }
    }
  }
}

// Fonction pour tester l'authentification utilisateur
async function testUserAuthentication() {
  log('Test d\'authentification utilisateur...', 'step');
  
  const testEmail = 'admin@sodiluxe.com';
  const testPassword = 'Admin123!';
  
  try {
    // Vérifier si l'utilisateur existe déjà
    try {
      await account.create(ID.unique(), testEmail, testPassword);
      log(`Utilisateur de test créé: ${testEmail}`, 'success');
    } catch (error) {
      if (error.code === 409) {
        log(`Utilisateur de test existe déjà: ${testEmail}`, 'info');
      } else {
        throw error;
      }
    }
    
    // Tenter de se connecter
    try {
      // Utiliser createEmailPasswordSession pour node-appwrite v17.0.0
      const session = await account.createEmailPasswordSession(testEmail, testPassword);
      log(`Connexion réussie avec l\'utilisateur de test: ${session.userId}`, 'success');
      return session;
    } catch (error) {
      log(`Erreur lors de la connexion: ${error.message}`, 'error');
      
      if (error.code === 401) {
        log('Solution: Vérifiez que le mot de passe est correct ou que le compte n\'est pas bloqué', 'solution');
      } else {
        log('Solution: Vérifiez les permissions d\'authentification dans la console Appwrite', 'solution');
      }
      
      return null;
    }
  } catch (error) {
    log(`Erreur lors du test d\'authentification: ${error.message}`, 'error');
    
    if (error.code === 401) {
      log('Solution: Vérifiez que le rôle "guests" a la permission "account" dans la console Appwrite', 'solution');
    } else {
      log('Solution: Vérifiez la configuration de l\'authentification dans la console Appwrite', 'solution');
    }
    
    return null;
  }
}

// Fonction pour vérifier la configuration CORS
async function checkCorsConfiguration() {
  log('Vérification de la configuration CORS...', 'step');
  
  const hostname = process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME || 'localhost';
  
  log(`Hostname configuré: ${hostname}`, 'info');
  log('Assurez-vous que ce hostname est ajouté dans les plateformes Web de votre projet Appwrite', 'info');
  log('Exemple: http://localhost:3000 pour le développement local', 'info');
  
  log('Solution: Allez dans la console Appwrite > Projet > Plateformes > Ajouter une plateforme > Web', 'solution');
}

// Fonction principale de diagnostic
async function runDiagnostic() {
  log('Démarrage du diagnostic Appwrite...', 'step');
  
  // Afficher les informations de configuration
  log(`Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || ENDPOINT}`, 'info');
  log(`Project ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || PROJECT_ID}`, 'info');
  log(`Database ID: ${process.env.APPWRITE_DATABASE_ID || DATABASE_ID}`, 'info');
  
  // Vérifier les variables d'environnement
  const envVarsOk = await checkEnvironmentVariables();
  if (!envVarsOk) {
    log('Des variables d\'environnement sont manquantes. Veuillez les configurer avant de continuer.', 'warning');
  }
  
  // Vérifier la configuration CORS
  await checkCorsConfiguration();
  
  // Tester la création d'une session anonyme
  const anonymousSession = await testAnonymousSession();
  
  // Tester l'accès aux collections en tant qu'invité
  await testCollectionAccess();
  
  // Tester l'authentification utilisateur
  const userSession = await testUserAuthentication();
  
  // Tester l'accès aux collections en tant qu'utilisateur authentifié
  if (userSession) {
    await testCollectionAccess(userSession);
  }
  
  log('Diagnostic Appwrite terminé.', 'step');
  log('Pour résoudre les problèmes identifiés, suivez les solutions proposées ci-dessus.', 'info');
}

// Exécuter le diagnostic
runDiagnostic().catch(error => {
  log(`Erreur inattendue lors du diagnostic: ${error.message}`, 'error');
  console.error(error);
});

