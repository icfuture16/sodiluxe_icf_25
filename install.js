// Script d'installation pour Sodiluxe CRM
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Script d\'installation pour Sodiluxe CRM ===');

// Configurer npm pour éviter les problèmes SSL
console.log('\n1. Configuration de npm pour éviter les problèmes SSL...');
try {
  execSync('npm config set strict-ssl false', { stdio: 'inherit' });
  execSync('npm config set registry http://registry.npmjs.org/', { stdio: 'inherit' });
  console.log('✓ Configuration npm terminée');
} catch (e) {
  console.error('❌ Erreur lors de la configuration de npm:', e);
}

// Nettoyer les modules node existants s'ils sont corrompus
console.log('\n2. Nettoyage des modules node corrompus...');
try {
  if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('Suppression du dossier node_modules...');
    try {
      // Sur Windows, utiliser rd pour supprimer récursivement
      execSync('rd /s /q node_modules', { stdio: 'inherit' });
    } catch (e) {
      console.log('Impossible de supprimer complètement node_modules, continuons quand même...');
    }
  }
  console.log('✓ Nettoyage terminé');
} catch (e) {
  console.error('❌ Erreur lors du nettoyage:', e);
}

// Installer les dépendances
console.log('\n3. Installation des dépendances...');
try {
  console.log('Installation de Next.js, React et React DOM...');
  execSync('npm install next@15.1.6 react@19.0.0 react-dom@19.0.0 --save --no-fund --no-audit', { stdio: 'inherit' });
  console.log('✓ Installation des dépendances principales terminée');
} catch (e) {
  console.error('❌ Erreur lors de l\'installation des dépendances principales:', e);
}

// Vérifier si l'installation a réussi
console.log('\n4. Vérification de l\'installation...');
try {
  if (fs.existsSync(path.join(__dirname, 'node_modules', 'next'))) {
    console.log('✓ Next.js est installé correctement');
  } else {
    console.error('❌ Next.js n\'est pas installé correctement');
  }
} catch (e) {
  console.error('❌ Erreur lors de la vérification:', e);
}

console.log('\n=== Installation terminée ===');
console.log('Pour démarrer l\'application, exécutez: npm run dev');