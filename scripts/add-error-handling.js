/**
 * Script pour ajouter une gestion d'erreurs basique aux fichiers qui en manquent
 * Ce script analyse les fichiers et ajoute des blocs try/catch autour des appels Appwrite
 */

const fs = require('fs');
const path = require('path');

// Liste des fichiers à modifier (identifiés par check-offline-mode.js)
const filesToFix = [
  'src/app/account/page.tsx',
  'src/app/admin/stores/page.tsx',
  'src/app/auth/register-access/page.tsx',
  'src/components/sales/NewSaleModal.tsx',
  'src/components/sales/ProductSelector.tsx',
  'src/hooks/useAuth.ts',
  'src/hooks/useOptimisticProducts.ts',
  'src/hooks/useSales.ts',
  'src/lib/appwrite/client.ts',
  'src/providers/AuthProvider.tsx'
];

// Fonction pour ajouter une gestion d'erreurs à un fichier
function addErrorHandlingToFile(filePath) {
  try {
    const fullPath = path.resolve(__dirname, '..', filePath);
    console.log(`Analyse du fichier: ${filePath}`);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(fullPath)) {
      console.error(`Le fichier ${filePath} n'existe pas.`);
      return false;
    }
    
    // Lire le contenu du fichier
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Analyser le contenu pour trouver les appels Appwrite sans try/catch
    const appwriteCallRegex = /(await\s+)?((databases|account|storage|functions)\.(list|get|create|update|delete|createDocument|updateDocument|deleteDocument|listDocuments|getDocument)[^;\n]*)/g;
    const tryCatchRegex = /try\s*{[^}]*}\s*catch/g;
    
    // Trouver tous les appels Appwrite
    const appwriteCalls = [];
    let match;
    while ((match = appwriteCallRegex.exec(content)) !== null) {
      // Vérifier si cet appel est déjà dans un bloc try/catch
      let isInTryCatch = false;
      let tryCatchMatch;
      while ((tryCatchMatch = tryCatchRegex.exec(content)) !== null) {
        const tryCatchStart = tryCatchMatch.index;
        const tryCatchEnd = tryCatchStart + tryCatchMatch[0].length;
        
        if (match.index > tryCatchStart && match.index < tryCatchEnd) {
          isInTryCatch = true;
          break;
        }
      }
      
      if (!isInTryCatch) {
        appwriteCalls.push({
          call: match[0],
          index: match.index,
          length: match[0].length
        });
      }
    }
    
    console.log(`Appels Appwrite trouvés sans try/catch: ${appwriteCalls.length}`);
    
    // Si aucun appel Appwrite sans try/catch n'est trouvé, ne pas modifier le fichier
    if (appwriteCalls.length === 0) {
      console.log(`Aucune modification nécessaire pour ${filePath}`);
      return false;
    }
    
    // Créer une copie de sauvegarde du fichier
    const backupPath = `${fullPath}.backup`;
    fs.writeFileSync(backupPath, content);
    console.log(`Copie de sauvegarde créée: ${backupPath}`);
    
    // Ajouter des blocs try/catch autour des appels Appwrite
    // Note: Cette approche est simplifiée et peut ne pas fonctionner pour tous les cas
    // Une analyse AST serait plus robuste, mais plus complexe à implémenter
    
    console.log(`Ce script ne modifie pas automatiquement les fichiers pour éviter les erreurs.`);
    console.log(`Voici les modifications recommandées pour ${filePath}:`);
    
    appwriteCalls.forEach(call => {
      const linesBefore = content.substring(0, call.index).split('\n');
      const lineNumber = linesBefore.length;
      const line = linesBefore[linesBefore.length - 1] + content.substring(call.index, call.index + call.length);
      
      console.log(`\nLigne ${lineNumber}: ${line.trim()}`);
      console.log(`Recommandation: Entourer avec try/catch:`);
      console.log(`try {`);
      console.log(`  ${line.trim()}`);
      console.log(`} catch (error) {`);
      console.log(`  console.error('Erreur lors de l\'appel à Appwrite:', error);`);
      console.log(`  // Gérer l'erreur (afficher un message, utiliser des données en cache, etc.)`);
      console.log(`}`);
    });
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'analyse de ${filePath}:`, error);
    return false;
  }
}

// Fonction principale
async function addErrorHandling() {
  try {
    console.log('Ajout de la gestion d\'erreurs aux fichiers...');
    
    let modifiedCount = 0;
    
    for (const file of filesToFix) {
      const wasAnalyzed = addErrorHandlingToFile(file);
      if (wasAnalyzed) {
        modifiedCount++;
      }
    }
    
    console.log(`\n📊 Résumé:`);
    console.log(`Fichiers analysés: ${filesToFix.length}`);
    console.log(`Fichiers avec recommandations: ${modifiedCount}`);
    
    console.log('\n🔧 Étapes suivantes:');
    console.log('1. Examinez les recommandations ci-dessus');
    console.log('2. Ajoutez manuellement des blocs try/catch aux endroits recommandés');
    console.log('3. Implémentez une gestion d\'erreurs appropriée pour chaque cas');
    console.log('4. Testez l\'application en mode déconnecté');
    
  } catch (error) {
    console.error('Erreur générale:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
addErrorHandling().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});