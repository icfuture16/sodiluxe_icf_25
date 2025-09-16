/**
 * Script de vérification des configurations CORS pour Appwrite
 * 
 * Ce script aide à diagnostiquer les problèmes CORS courants lors de l'utilisation
 * d'Appwrite avec une application Next.js en développement local.
 * 
 * Utilisation: node scripts/check-cors.js
 */

require('dotenv').config({ path: '.env.local' });
const http = require('http');
const https = require('https');
const url = require('url');
const os = require('os');
const chalk = require('chalk'); // Vous devrez installer cette dépendance: npm install chalk

// Récupération des variables d'environnement
const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const appwriteProjectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const appwriteHostname = process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME;

// Fonction pour obtenir l'adresse IP locale
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Vérification des variables d'environnement
function checkEnvironmentVariables() {
  console.log(chalk.blue("=== Vérification des variables d'environnement ==="));
  
  if (!appwriteEndpoint) {
    console.log(chalk.red('❌ NEXT_PUBLIC_APPWRITE_ENDPOINT n\'est pas défini'));
  } else {
    console.log(chalk.green('✅ NEXT_PUBLIC_APPWRITE_ENDPOINT: ' + appwriteEndpoint));
  }
  
  if (!appwriteProjectId) {
    console.log(chalk.red('❌ NEXT_PUBLIC_APPWRITE_PROJECT_ID n\'est pas défini'));
  } else {
    console.log(chalk.green('✅ NEXT_PUBLIC_APPWRITE_PROJECT_ID: ' + appwriteProjectId));
  }
  
  const localIp = getLocalIpAddress();
  if (!appwriteHostname) {
    console.log(chalk.yellow('⚠️ NEXT_PUBLIC_APPWRITE_HOSTNAME n\'est pas défini'));
    console.log(chalk.yellow(`   Suggestion: ajoutez NEXT_PUBLIC_APPWRITE_HOSTNAME=http://${localIp}:3000 à votre .env.local`));
  } else {
    console.log(chalk.green('✅ NEXT_PUBLIC_APPWRITE_HOSTNAME: ' + appwriteHostname));
    
    // Vérifier si l'hostname contient l'adresse IP locale
    if (!appwriteHostname.includes(localIp) && !appwriteHostname.includes('localhost')) {
      console.log(chalk.yellow(`⚠️ L'adresse IP dans NEXT_PUBLIC_APPWRITE_HOSTNAME ne correspond pas à votre IP locale (${localIp})`));
    }
  }
}

// Vérification de la connexion à Appwrite
async function checkAppwriteConnection() {
  console.log(chalk.blue('\n=== Vérification de la connexion à Appwrite ==='));
  
  if (!appwriteEndpoint || !appwriteProjectId) {
    console.log(chalk.red('❌ Impossible de vérifier la connexion: variables d\'environnement manquantes'));
    return;
  }
  
  const parsedUrl = url.parse(appwriteEndpoint);
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: '/v1/health',
    method: 'GET',
    headers: {
      'X-Appwrite-Project': appwriteProjectId
    }
  };
  
  const requestLib = parsedUrl.protocol === 'https:' ? https : http;
  
  return new Promise((resolve) => {
    const req = requestLib.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(chalk.green('✅ Connexion à Appwrite réussie'));
      } else {
        console.log(chalk.red(`❌ Connexion à Appwrite échouée: ${res.statusCode}`));
      }
      resolve();
    });
    
    req.on('error', (error) => {
      console.log(chalk.red(`❌ Erreur de connexion à Appwrite: ${error.message}`));
      resolve();
    });
    
    req.end();
  });
}

// Vérification de la configuration next.config.js
function checkNextConfig() {
  console.log(chalk.blue('\n=== Vérification de la configuration Next.js ==='));
  
  const fs = require('fs');
  if (!fs.existsSync('./next.config.js')) {
    console.log(chalk.red('❌ Le fichier next.config.js n\'existe pas'));
    return;
  }
  
  try {
    const configContent = fs.readFileSync('./next.config.js', 'utf8');
    if (configContent.includes('Access-Control-Allow-Origin')) {
      console.log(chalk.green('✅ Configuration CORS trouvée dans next.config.js'));
    } else {
      console.log(chalk.yellow('⚠️ Aucune configuration CORS trouvée dans next.config.js'));
    }
  } catch (error) {
    console.log(chalk.red(`❌ Erreur lors de la lecture de next.config.js: ${error.message}`));
  }
}

// Affichage des recommandations
function showRecommendations() {
  console.log(chalk.blue('\n=== Recommandations ==='));
  console.log(chalk.cyan("1. Assurez-vous d'avoir ajouté votre domaine de développement dans la console Appwrite:"));
  console.log(chalk.cyan('   - Allez dans la console Appwrite > Projet > Platforms > Web > Domains'));
  console.log(chalk.cyan(`   - Ajoutez http://localhost:3000 et http://${getLocalIpAddress()}:3000`));
  
  console.log(chalk.cyan('\n2. Vérifiez que client.ts utilise correctement setHostname:'));
  console.log(chalk.cyan('   - Ouvrez src/lib/appwrite/client.ts'));
  console.log(chalk.cyan('   - Assurez-vous que le code extrait correctement le hostname de NEXT_PUBLIC_APPWRITE_HOSTNAME'));
  
  console.log(chalk.cyan('\n3. Si les problèmes persistent:'));
  console.log(chalk.cyan('   - Videz le cache de votre navigateur'));
  console.log(chalk.cyan('   - Essayez avec une fenêtre de navigation privée'));
  console.log(chalk.cyan('   - Redémarrez le serveur de développement'));
}

// Exécution des vérifications
async function runChecks() {
  console.log(chalk.yellow('=== Diagnostic des problèmes CORS avec Appwrite ===\n'));
  
  checkEnvironmentVariables();
  await checkAppwriteConnection();
  checkNextConfig();
  showRecommendations();
  
  console.log(chalk.yellow('\n=== Fin du diagnostic ==='));
}

runChecks();

