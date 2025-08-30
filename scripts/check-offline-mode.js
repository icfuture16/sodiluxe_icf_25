/**
 * Script pour vérifier si l'application peut fonctionner en mode déconnecté
 * Ce script teste si l'application peut fonctionner sans accès à la base de données
 */

const fs = require('fs');
const path = require('path');

// Fonction pour vérifier si un fichier contient des appels à Appwrite
function checkFileForAppwriteCalls(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const appwriteImportRegex = /import.*from.*appwrite/i;
    const appwriteUsageRegex = /databases\.(list|get|create|update|delete)|(account|storage|functions)\.(.*)/i;
    
    const hasAppwriteImport = appwriteImportRegex.test(content);
    const hasAppwriteUsage = appwriteUsageRegex.test(content);
    
    return {
      path: filePath,
      hasAppwriteImport,
      hasAppwriteUsage,
      content: hasAppwriteImport || hasAppwriteUsage ? content : null
    };
  } catch (error) {
    return {
      path: filePath,
      error: error.message
    };
  }
}

// Fonction pour vérifier si un fichier contient des gestionnaires d'erreurs pour les appels Appwrite
function checkFileForErrorHandling(filePath, fileContent) {
  if (!fileContent) return { hasErrorHandling: false };
  
  const tryCatchRegex = /try\s*{[^}]*databases\.[^}]*}\s*catch/i;
  const errorCheckRegex = /if\s*\([^)]*error[^)]*\)|error\s*=>/i;
  
  const hasTryCatch = tryCatchRegex.test(fileContent);
  const hasErrorCheck = errorCheckRegex.test(fileContent);
  
  return {
    hasErrorHandling: hasTryCatch || hasErrorCheck,
    hasTryCatch,
    hasErrorCheck
  };
}

// Fonction pour scanner récursivement un répertoire
function scanDirectory(dir, fileExtensions = ['.js', '.jsx', '.ts', '.tsx']) {
  const results = [];
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.next' && file !== 'scripts') {
      results.push(...scanDirectory(filePath, fileExtensions));
    } else if (stat.isFile() && fileExtensions.includes(path.extname(file))) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Fonction principale
async function checkOfflineMode() {
  try {
    console.log('Vérification du mode déconnecté...');
    
    // Trouver tous les fichiers JavaScript/TypeScript dans le projet
    const projectRoot = path.resolve(__dirname, '..');
    console.log(`Analyse du répertoire: ${projectRoot}`);
    
    const files = scanDirectory(projectRoot);
    console.log(`Nombre de fichiers trouvés: ${files.length}`);
    
    // Analyser chaque fichier pour les appels à Appwrite
    const filesWithAppwrite = [];
    const filesWithoutErrorHandling = [];
    
    for (const file of files) {
      const result = checkFileForAppwriteCalls(file);
      
      if (result.hasAppwriteImport || result.hasAppwriteUsage) {
        filesWithAppwrite.push(file);
        
        // Vérifier la gestion des erreurs
        const errorHandling = checkFileForErrorHandling(file, result.content);
        if (!errorHandling.hasErrorHandling) {
          filesWithoutErrorHandling.push(file);
        }
      }
    }
    
    // Afficher les résultats
    console.log(`\n📊 Résultats de l'analyse:`);
    console.log(`Fichiers utilisant Appwrite: ${filesWithAppwrite.length}`);
    console.log(`Fichiers sans gestion d'erreurs: ${filesWithoutErrorHandling.length}`);
    
    if (filesWithAppwrite.length > 0) {
      console.log('\n📝 Fichiers utilisant Appwrite:');
      filesWithAppwrite.forEach(file => {
        const relativePath = path.relative(projectRoot, file);
        console.log(`- ${relativePath}`);
      });
    }
    
    if (filesWithoutErrorHandling.length > 0) {
      console.log('\n⚠️ Fichiers sans gestion d\'erreurs:');
      filesWithoutErrorHandling.forEach(file => {
        const relativePath = path.relative(projectRoot, file);
        console.log(`- ${relativePath}`);
      });
    }
    
    console.log('\n🔧 Recommandations pour le mode déconnecté:');
    console.log('1. Ajoutez une gestion d\'erreurs à tous les appels Appwrite');
    console.log('2. Implémentez un mécanisme de mise en cache local (localStorage, IndexedDB)');
    console.log('3. Créez un état "isOffline" dans votre application');
    console.log('4. Affichez un message à l\'utilisateur lorsque l\'application est en mode déconnecté');
    console.log('5. Permettez certaines fonctionnalités de base même sans connexion à Appwrite');
    
  } catch (error) {
    console.error('Erreur générale:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
checkOfflineMode().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});