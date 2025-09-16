// Script pour démarrer l'application Sodiluxe
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

console.log('Démarrage de l\'application Sodiluxe...');

// Vérifier si .env.local existe
if (!fs.existsSync(path.join(__dirname, '.env.local'))) {
  console.log('Création du fichier .env.local à partir de .env.example...');
  fs.copyFileSync(
    path.join(__dirname, '.env.example'),
    path.join(__dirname, '.env.local')
  );
}

// Configuration de npm pour éviter les problèmes SSL
console.log('Configuration de npm pour éviter les problèmes SSL...');
try {
  execSync('npm config set strict-ssl false', { stdio: 'inherit' });
  execSync('npm config set registry http://registry.npmjs.org/', { stdio: 'inherit' });
} catch (e) {
  console.error('Erreur lors de la configuration de npm:', e);
}

// Vérifier l'installation de Next.js
console.log('Vérification de l\'installation de Next.js...');

// Vérifier si Next.js est installé
const isNextInstalled = fs.existsSync(path.join(__dirname, 'node_modules', 'next'));
if (!isNextInstalled) {
  console.log('Next.js n\'est pas installé correctement. Exécutez le script d\'installation avec:');
  console.log('node install.js');
}

// Créer un serveur HTTP simple pour afficher un message en attendant
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sodiluxe CRM - Démarrage</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .message { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(0,0,0,.3); border-radius: 50%; border-top-color: #333; animation: spin 1s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .code { background-color: #f1f1f1; padding: 10px; border-radius: 4px; font-family: monospace; }
        .warning { color: #856404; background-color: #fff3cd; border-left: 4px solid #ffeeba; padding: 10px; }
        .steps { background-color: #e9ecef; padding: 15px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>Sodiluxe CRM</h1>
      <div class="message">
        <p><span class="loading"></span> L'application est en cours de démarrage...</p>
        <p>Nous avons détecté que Next.js n'est pas correctement installé sur votre système.</p>
      </div>
      
      <div class="steps">
        <h2>Instructions d'installation</h2>
        <p>Veuillez suivre ces étapes pour installer et démarrer l'application :</p>
        <ol>
          <li>Ouvrez une invite de commande (PowerShell ou CMD)</li>
          <li>Naviguez vers le dossier du projet :<br>
            <div class="code">cd ${__dirname.replace(/\\/g, '\\\\')}</div>
          </li>
          <li>Exécutez le script d'installation :<br>
            <div class="code">node install.js</div>
          </li>
          <li>Une fois l'installation terminée, démarrez l'application :<br>
            <div class="code">npm run dev</div>
          </li>
        </ol>
        
        <p class="warning"><strong>Note :</strong> Si vous rencontrez des problèmes avec SSL ou npm, le script d'installation tentera de les résoudre automatiquement.</p>
      </div>
      
      <div class="message">
        <h2>À propos de Sodiluxe CRM</h2>
        <p>Sodiluxe CRM est une application de gestion de la relation client développée avec Next.js et Appwrite.</p>
        <p>Fonctionnalités principales :</p>
        <ul>
          <li>Gestion des clients</li>
          <li>Suivi des ventes et des débiteurs</li>
          <li>Gestion des cartes de fidélité</li>
          <li>Système de réservations</li>
          <li>Service après-vente (SAV)</li>
          <li>Tableau de bord analytique</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

server.listen(3000, () => {
  console.log('Serveur temporaire démarré sur http://localhost:3000');
  console.log('Tentative de démarrage de l\'application...');
  
  try {
    // Essayer de démarrer avec npm run dev
    console.log('Tentative avec npm run dev...');
    const npmProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });
    
    npmProcess.on('error', (error) => {
      console.error('Erreur lors du démarrage avec npm run dev:', error);
      console.log('Tentative avec npx next dev...');
      
      try {
        const npxProcess = spawn('npx', ['next', 'dev'], {
          stdio: 'inherit',
          shell: true
        });
        
        npxProcess.on('error', (error) => {
          console.error('Erreur lors du démarrage avec npx next dev:', error);
          console.log('Veuillez démarrer l\'application manuellement avec npm run dev');
        });
      } catch (e) {
        console.error('Impossible de démarrer le serveur avec npx:', e);
      }
    });
  } catch (e) {
    console.error('Erreur:', e);
  }
});

console.log('Accédez à http://localhost:3000 dans votre navigateur');

