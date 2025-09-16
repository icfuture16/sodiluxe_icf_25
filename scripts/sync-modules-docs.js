/**
 * Script de synchronisation des dossiers de documentation des modules
 * 
 * Ce script synchronise les fichiers entre les dossiers docs/modules et documentation/modules
 * pour assurer la cohérence de la documentation.
 */

const fs = require('fs');
const path = require('path');

// Chemins des dossiers à synchroniser
const docsModulesPath = path.join(__dirname, '..', 'docs', 'modules');
const documentationModulesPath = path.join(__dirname, '..', 'documentation', 'modules');

// Fonction pour synchroniser les fichiers entre deux dossiers
function syncFolders(sourceDir, targetDir) {
  console.log(`Synchronisation des fichiers de ${sourceDir} vers ${targetDir}...`);
  console.log(`Source directory: ${sourceDir}`);
  console.log(`Target directory: ${targetDir}`);
  
  // Vérifier que les deux dossiers existent
  if (!fs.existsSync(sourceDir)) {
    console.error(`Le dossier source ${sourceDir} n'existe pas.`);
    return;
  }
  
  if (!fs.existsSync(targetDir)) {
    console.error(`Le dossier cible ${targetDir} n'existe pas.`);
    return;
  }
  
  // Lire les fichiers du dossier source
  const sourceFiles = fs.readdirSync(sourceDir);
  console.log(`Fichiers trouvés dans le dossier source: ${sourceFiles.join(', ')}`);
  
  // Lire les fichiers du dossier cible
  const targetFiles = fs.readdirSync(targetDir);
  console.log(`Fichiers trouvés dans le dossier cible: ${targetFiles.join(', ')}`);
  
  // Synchroniser les fichiers du dossier source vers le dossier cible
  for (const file of sourceFiles) {
    // Ignorer les fichiers cachés et les dossiers
    if (file.startsWith('.') || fs.statSync(path.join(sourceDir, file)).isDirectory()) {
      continue;
    }
    
    const sourceFilePath = path.join(sourceDir, file);
    const targetFilePath = path.join(targetDir, file);
    
    // Vérifier si le fichier existe dans le dossier cible
    const fileExistsInTarget = targetFiles.includes(file);
    
    // Comparer les dates de modification
    let shouldCopy = !fileExistsInTarget;
    
    if (fileExistsInTarget) {
      const sourceStats = fs.statSync(sourceFilePath);
      const targetStats = fs.statSync(targetFilePath);
      
      // Si le fichier source est plus récent, le copier vers la cible
      if (sourceStats.mtime > targetStats.mtime) {
        shouldCopy = true;
      }
    }
    
    if (shouldCopy) {
      try {
        fs.copyFileSync(sourceFilePath, targetFilePath);
        console.log(`✅ Fichier copié: ${file}`);
      } catch (error) {
        console.error(`❌ Erreur lors de la copie du fichier ${file}:`, error);
      }
    } else {
      console.log(`ℹ️ Fichier déjà à jour: ${file}`);
    }
  }
}

// Synchroniser dans les deux sens
console.log('=== Synchronisation des documents des modules ===');

console.log('\n1. Synchronisation docs/modules -> documentation/modules');
syncFolders(docsModulesPath, documentationModulesPath);

console.log('\n2. Synchronisation documentation/modules -> docs/modules');
syncFolders(documentationModulesPath, docsModulesPath);

console.log('\n✅ Synchronisation terminée!');
console.log('\nNote: Pour maintenir la cohérence de la documentation, exécutez ce script après chaque modification des fichiers de documentation des modules.');

