/**
 * Script de vérification de la configuration Appwrite
 * 
 * Ce script vérifie la configuration complète d'Appwrite pour le projet CRM Sodiluxe :
 * - Vérification des variables d'environnement
 * - Test de connexion à Appwrite
 * - Vérification de l'existence de la base de données
 * - Vérification des collections
 * - Test CORS
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Databases, Account } = require('node-appwrite');
const https = require('https');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// ANSI color codes pour une meilleure lisibilité
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Fonction pour afficher du texte coloré
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Fonction pour afficher les en-têtes de section
function printHeader(text) {
  console.log('\n' + colorize('='.repeat(80), 'bright'));
  console.log(colorize(` ${text} `, 'bright'));
  console.log(colorize('='.repeat(80), 'bright') + '\n');
}

// Vérification des variables d'environnement
function checkEnvironmentVariables() {
  printHeader('VÉRIFICATION DES VARIABLES D\'ENVIRONNEMENT');
  
  const requiredVars = [
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
    'NEXT_PUBLIC_APPWRITE_HOSTNAME'
  ];
  
  const optionalVars = [
    'APPWRITE_API_KEY',
    'APPWRITE_DATABASE_ID'
  ];
  
  let allRequiredVarsPresent = true;
  
  console.log('Variables requises:');
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`  ${colorize('✖', 'red')} ${varName}: ${colorize('Manquante', 'red')}`);
      allRequiredVarsPresent = false;
    } else {
      console.log(`  ${colorize('✓', 'green')} ${varName}: ${process.env[varName]}`);
    }
  });
  
  console.log('\nVariables optionnelles:');
  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`  ${colorize('ℹ', 'yellow')} ${varName}: ${colorize('Non définie', 'yellow')}`);
    } else {
      const value = varName === 'APPWRITE_API_KEY' ? '********' : process.env[varName];
      console.log(`  ${colorize('✓', 'green')} ${varName}: ${value}`);
    }
  });
  
  if (!allRequiredVarsPresent) {
    console.log('\n' + colorize('⚠️ Certaines variables d\'environnement requises sont manquantes!', 'yellow'));
  }
  
  return allRequiredVarsPresent;
}

// Test de connexion à Appwrite
async function testAppwriteConnection() {
  printHeader('TEST DE CONNEXION À APPWRITE');
  
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  
  if (!endpoint || !projectId) {
    console.log(colorize('✖', 'red') + ' Impossible de tester la connexion: Endpoint ou Project ID manquant');
    return false;
  }
  
  console.log(`Tentative de connexion à: ${endpoint}`);
  console.log(`Project ID: ${projectId}\n`);
  
  try {
    const url = new URL(endpoint);
    const healthPath = url.pathname === '/v1' ? '/v1/health' : '/health';
    
    console.log(`Test de l'endpoint de santé: ${url.origin}${healthPath}`);
    
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: 443,
        path: healthPath,
        method: 'GET'
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, data });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.end();
    });
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(colorize('✓', 'green') + ` Connexion réussie (${response.statusCode})`);
      try {
        const healthData = JSON.parse(response.data);
        console.log('  Informations du serveur:');
        console.log(`  - Version: ${healthData.version || 'Non disponible'}`);
        console.log(`  - Status: ${healthData.status || 'OK'}`);
      } catch (e) {
        console.log(`  Réponse: ${response.data.substring(0, 100)}${response.data.length > 100 ? '...' : ''}`);
      }
      return true;
    } else {
      console.log(colorize('✖', 'red') + ` Échec de la connexion (${response.statusCode})`);
      console.log(`  Réponse: ${response.data}`);
      return false;
    }
  } catch (error) {
    console.log(colorize('✖', 'red') + ` Erreur de connexion: ${error.message}`);
    return false;
  }
}

// Vérification de la base de données
async function checkDatabase() {
  printHeader('VÉRIFICATION DE LA BASE DE DONNÉES');
  
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID || '68bf1e7b003c6b340d6e'; // Utiliser la valeur par défaut si non définie
  
  if (!apiKey) {
    console.log(colorize('ℹ', 'yellow') + ' Clé API non définie. Impossible de vérifier la base de données.');
    console.log('  Pour vérifier la base de données, ajoutez APPWRITE_API_KEY à votre fichier .env.local');
    return false;
  }
  
  console.log(`Vérification de la base de données: ${databaseId}`);
  
  try {
    // Configuration du client Appwrite
    const client = new Client();
    client
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    
    const databases = new Databases(client);
    
    try {
      const database = await databases.get(databaseId);
      console.log(colorize('✓', 'green') + ' Base de données trouvée:');
      console.log(`  - ID: ${database.$id}`);
      console.log(`  - Nom: ${database.name}`);
      console.log(`  - Description: ${database.description || 'Aucune description'}`);
      
      // Vérification des collections
      console.log('\nVérification des collections:');
      
      const collections = await databases.listCollections(databaseId);
      
      if (collections.total === 0) {
        console.log(colorize('ℹ', 'yellow') + ' Aucune collection trouvée dans la base de données.');
        console.log('  Exécutez le script create-appwrite-collections.js pour créer les collections.');
      } else {
        console.log(colorize('✓', 'green') + ` ${collections.total} collection(s) trouvée(s):`);
        collections.documents.forEach(collection => {
          console.log(`  - ${collection.name} (${collection.$id})`);
        });
      }
      
      return true;
    } catch (error) {
      if (error.code === 404) {
        console.log(colorize('✖', 'red') + ` Base de données '${databaseId}' non trouvée.`);
        console.log('  Exécutez le script create-database.js pour créer la base de données.');
      } else {
        console.log(colorize('✖', 'red') + ` Erreur lors de la vérification de la base de données: ${error.message}`);
        if (error.code === 401) {
          console.log('  Vérifiez que votre clé API a les permissions suffisantes (databases.read).');
        }
      }
      return false;
    }
  } catch (error) {
    console.log(colorize('✖', 'red') + ` Erreur: ${error.message}`);
    return false;
  }
}

// Vérification de la configuration client.ts
function checkClientConfiguration() {
  printHeader('VÉRIFICATION DE LA CONFIGURATION CLIENT');
  
  const fs = require('fs');
  const path = require('path');
  const clientPath = path.join(__dirname, '../src/lib/appwrite/client.ts');
  
  try {
    const clientContent = fs.readFileSync(clientPath, 'utf8');
    console.log(colorize('✓', 'green') + ' Fichier client.ts trouvé');
    
    // Vérifier l'ID de la base de données
    const databaseIdMatch = clientContent.match(/DATABASE_ID\s*=\s*['"]([^'"]+)['"]/);
    if (databaseIdMatch && databaseIdMatch[1]) {
      const clientDatabaseId = databaseIdMatch[1];
      console.log(`ID de la base de données dans client.ts: ${clientDatabaseId}`);
      
      const envDatabaseId = process.env.APPWRITE_DATABASE_ID || '68bf1e7b003c6b340d6e';
      if (clientDatabaseId === envDatabaseId) {
        console.log(colorize('✓', 'green') + ' L\'ID de la base de données correspond à la variable d\'environnement');
      } else {
        console.log(colorize('✖', 'red') + ' L\'ID de la base de données ne correspond pas à la variable d\'environnement');
        console.log(`  - client.ts: ${clientDatabaseId}`);
        console.log(`  - .env.local: ${envDatabaseId}`);
      }
    } else {
      console.log(colorize('ℹ', 'yellow') + ' ID de la base de données non trouvé dans client.ts');
    }
    
    // Vérifier la configuration CORS
    if (clientContent.includes('Origin') && clientContent.includes('NEXT_PUBLIC_APPWRITE_HOSTNAME')) {
      console.log(colorize('✓', 'green') + ' Configuration CORS trouvée dans client.ts');
    } else {
      console.log(colorize('ℹ', 'yellow') + ' Configuration CORS non trouvée dans client.ts');
    }
    
    return true;
  } catch (error) {
    console.log(colorize('✖', 'red') + ` Erreur lors de la lecture de client.ts: ${error.message}`);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log(colorize('\nVÉRIFICATION DE LA CONFIGURATION APPWRITE', 'bright'));
  console.log(colorize('=====================================\n', 'bright'));
  
  const envVarsOk = checkEnvironmentVariables();
  const connectionOk = await testAppwriteConnection();
  const clientConfigOk = checkClientConfiguration();
  const databaseOk = await checkDatabase();
  
  printHeader('RÉSUMÉ');
  console.log(`Variables d'environnement: ${envVarsOk ? colorize('✓ OK', 'green') : colorize('✖ Problèmes détectés', 'red')}`);
  console.log(`Connexion Appwrite: ${connectionOk ? colorize('✓ OK', 'green') : colorize('✖ Problèmes détectés', 'red')}`);
  console.log(`Configuration client: ${clientConfigOk ? colorize('✓ OK', 'green') : colorize('✖ Problèmes détectés', 'red')}`);
  console.log(`Base de données: ${databaseOk ? colorize('✓ OK', 'green') : colorize('✖ Problèmes détectés', 'red')}`);
  
  if (!databaseOk) {
    console.log('\n' + colorize('ACTIONS RECOMMANDÉES:', 'bright'));
    console.log('1. Ajoutez une clé API valide à votre fichier .env.local:');
    console.log('   APPWRITE_API_KEY=votre-cle-api');
    console.log('2. Exécutez le script de création de la base de données:');
    console.log('   node scripts/create-database.js');
    console.log('3. Exécutez le script de création des collections:');
    console.log('   node scripts/create-appwrite-collections.js');
    console.log('4. Redémarrez votre serveur de développement:');
    console.log('   npm run dev');
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('Erreur lors de l\'exécution du script:', error);
});

