/**
 * Script pour nettoyer le cache de Next.js et du navigateur
 * Utile pour résoudre les problèmes de ChunkLoadError
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Chemins des dossiers à nettoyer
const nextCacheDir = path.join(process.cwd(), '.next');
const nodeModulesCacheDir = path.join(process.cwd(), 'node_modules', '.cache');

/**
 * Supprime un dossier de manière récursive
 */
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(chalk.yellow(`Suppression de ${dirPath}...`));
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(chalk.green(`✓ ${dirPath} supprimé avec succès`));
      return true;
    } catch (error) {
      console.error(chalk.red(`Erreur lors de la suppression de ${dirPath}:`), error);
      return false;
    }
  } else {
    console.log(chalk.blue(`Le dossier ${dirPath} n'existe pas, aucune action nécessaire`));
    return false;
  }
}

/**
 * Fonction principale
 */
function cleanCache() {
  console.log(chalk.cyan('=== Nettoyage du cache Next.js ==='));
  console.log(chalk.cyan('Cette opération peut aider à résoudre les problèmes de ChunkLoadError'));
  
  // Nettoyer le cache de Next.js
  const nextCleaned = removeDirectory(nextCacheDir);
  
  // Nettoyer le cache de node_modules
  const nodeCacheCleaned = removeDirectory(nodeModulesCacheDir);
  
  if (nextCleaned || nodeCacheCleaned) {
    console.log(chalk.cyan('\n=== Redémarrage du serveur de développement ==='));
    console.log(chalk.yellow('Pour appliquer les changements, exécutez:'));
    console.log(chalk.white('npm run dev'));
    
    console.log(chalk.cyan('\n=== Instructions pour le navigateur ==='));
    console.log(chalk.yellow('Pour un nettoyage complet, videz également le cache de votre navigateur:'));
    console.log(chalk.white('1. Ouvrez les outils de développement (F12 ou Ctrl+Shift+I)'));
    console.log(chalk.white('2. Cliquez sur l\'onglet "Application" ou "Network"'));
    console.log(chalk.white('3. Cochez "Disable cache" ou videz le cache manuellement'));
    console.log(chalk.white('4. Ou utilisez Ctrl+F5 pour recharger la page sans utiliser le cache'));
  } else {
    console.log(chalk.blue('Aucun cache à nettoyer.'));
  }
}

// Exécuter la fonction principale
cleanCache();