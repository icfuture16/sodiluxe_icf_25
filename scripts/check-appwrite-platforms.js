/**
 * Script pour vérifier les plateformes configurées dans Appwrite
 * Ce script simule une requête à l'API Appwrite pour vérifier les plateformes configurées
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const https = require('https');
const url = require('url');

// Vérification des variables d'environnement requises
if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  console.error('Erreur: Variables d\'environnement manquantes.');
  console.error('Veuillez définir NEXT_PUBLIC_APPWRITE_ENDPOINT et NEXT_PUBLIC_APPWRITE_PROJECT_ID dans le fichier .env.local');
  process.exit(1);
}

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

// Fonction pour coloriser le texte
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Fonction pour imprimer les en-têtes de section
function printHeader(text) {
  console.log('\n' + colorize('='.repeat(80), 'bright'));
  console.log(colorize(` ${text} `, 'bright'));
  console.log(colorize('='.repeat(80), 'bright') + '\n');
}

// Fonction principale
async function checkPlatforms() {
  printHeader('VÉRIFICATION DES PLATEFORMES APPWRITE');
  
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const hostname = process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME || 'http://localhost:3000';
  
  console.log(`Endpoint Appwrite: ${endpoint}`);
  console.log(`ID du projet: ${projectId}`);
  console.log(`Hostname configuré: ${hostname}\n`);
  
  // Tester différentes origines pour voir lesquelles sont acceptées
  const originsToTest = [
    hostname,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.5:3000',
    'https://cloud.appwrite.io'
  ];
  
  console.log('Test des origines CORS:');
  
  for (const origin of originsToTest) {
    console.log(`\nTest avec Origin: ${origin}`);
    
    try {
      const parsedUrl = new URL(endpoint);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: '/v1/account/sessions/anonymous',
        method: 'POST',
        headers: {
          'Origin': origin,
          'X-Appwrite-Project': projectId,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              statusMessage: res.statusMessage,
              headers: res.headers,
              data: data
            });
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        req.end();
      });
      
      console.log(`  Status: ${response.statusCode} ${response.statusMessage}`);
      
      // Vérifier les en-têtes CORS
      const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
        'access-control-allow-methods': response.headers['access-control-allow-methods']
      };
      
      console.log('  En-têtes CORS:');
      Object.entries(corsHeaders).forEach(([header, value]) => {
        if (value) {
          console.log(`    ${header}: ${value}`);
        } else {
          console.log(`    ${header}: ${colorize('Non présent', 'yellow')}`);
        }
      });
      
      // Vérifier si CORS est correctement configuré
      if (corsHeaders['access-control-allow-origin']) {
        const allowedOrigins = corsHeaders['access-control-allow-origin'].split(',').map(o => o.trim());
        
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          console.log('  ' + colorize('✓ CORS est correctement configuré pour cette origine', 'green'));
        } else {
          console.log('  ' + colorize(`✖ CORS n'est pas configuré pour ${origin}`, 'red'));
          console.log('  ' + colorize(`  Origines autorisées: ${allowedOrigins.join(', ')}`, 'yellow'));
        }
      } else {
        console.log('  ' + colorize('✖ Aucun en-tête CORS trouvé dans la réponse', 'red'));
      }
      
      // Analyser la réponse
      if (response.data) {
        try {
          const jsonData = JSON.parse(response.data);
          if (jsonData.message) {
            console.log(`  Message: ${jsonData.message}`);
          }
        } catch (e) {
          // Ignorer les erreurs de parsing JSON
        }
      }
      
    } catch (error) {
      console.error(`  Erreur: ${error.message}`);
    }
  }
  
  printHeader('RECOMMANDATIONS');
  
  console.log('1. Vérifiez que les plateformes suivantes sont configurées dans la console Appwrite:');
  console.log(`   - ${hostname}`);
  console.log('   - http://localhost:3000');
  console.log('   - http://127.0.0.1:3000');
  console.log('   - http://192.168.1.5:3000');
  console.log('\n2. Pour configurer les plateformes:');
  console.log('   - Connectez-vous à la console Appwrite');
  console.log('   - Accédez aux paramètres de votre projet');
  console.log('   - Naviguez vers la section "Plateformes"');
  console.log('   - Ajoutez les plateformes manquantes');
  console.log('\n3. Après avoir ajouté les plateformes:');
  console.log('   - Videz le cache du navigateur');
  console.log('   - Redémarrez le serveur de développement');
}

// Exécuter la fonction principale
checkPlatforms().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});