const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.production' });

// Configuration Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = '68599714002eef233c16';
const COLLECTION_ID = 'after_sales_service';

// Fonction pour générer user_seller à partir du nom complet
function generateUserSeller(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return 'USER_UNKNOWN';
  }

  // Nettoyer le nom : supprimer les accents, caractères spéciaux, espaces multiples
  const cleanName = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-zA-Z0-9\s]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .trim()
    .toUpperCase();

  const words = cleanName.split(' ').filter(word => word.length > 0);
  
  if (words.length === 0) {
    return 'USER_UNKNOWN';
  }

  let userSeller = '';
  
  if (words.length === 1) {
    // Un seul mot : prendre les 15 premiers caractères
    userSeller = words[0].substring(0, 15);
  } else if (words.length === 2) {
    // Deux mots : prendre les 7 premiers caractères de chaque mot
    userSeller = words[0].substring(0, 7) + words[1].substring(0, 7);
  } else {
    // Plus de deux mots : prendre les 5 premiers caractères des 3 premiers mots
    userSeller = words[0].substring(0, 5) + words[1].substring(0, 5) + words[2].substring(0, 5);
  }
  
  // S'assurer que la longueur ne dépasse pas 15 caractères
  return userSeller.substring(0, 15);
}

async function migrateSavData() {
  try {
    console.log('🔄 Migration des données SAV existantes...');
    
    // Récupérer tous les documents SAV
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.limit(100) // Ajuster selon le nombre de documents
      ]
    );
    
    console.log(`📊 ${response.documents.length} documents SAV trouvés`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const document of response.documents) {
      try {
        // Générer user_seller à partir de technicianName
        const technicianName = document.technicianName || 'Utilisateur Inconnu';
        const userSeller = generateUserSeller(technicianName);
        
        // Mettre à jour le document avec user_seller
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID,
          document.$id,
          {
            user_seller: userSeller
          }
        );
        
        console.log(`✅ Document ${document.$id} migré: ${technicianName} -> ${userSeller}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Erreur lors de la migration du document ${document.$id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Résultats de la migration:');
    console.log(`✅ Documents migrés avec succès: ${migratedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📊 Total: ${response.documents.length}`);
    
    if (migratedCount > 0) {
      console.log('\n🎉 Migration terminée avec succès!');
      console.log('\n📝 Prochaines étapes:');
      console.log('1. Vérifier que les nouvelles demandes SAV utilisent user_seller');
      console.log('2. Supprimer les anciens attributs technicien si tout fonctionne');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale lors de la migration:', error);
  }
}

// Exécution du script
if (require.main === module) {
  migrateSavData();
}

module.exports = { migrateSavData, generateUserSeller };