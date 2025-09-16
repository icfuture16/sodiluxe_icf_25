const { Client, Databases } = require('node-appwrite');
const config = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(config.ENDPOINT)
  .setProject(config.PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = config.DATABASE_ID;
const SALES_COLLECTION_ID = config.COLLECTIONS.SALES;
const USERS_COLLECTION_ID = config.COLLECTIONS.USERS;

async function fixUserSellerForSpecificUser() {
  const userId = '688987f7003216df6426';
  const correctUserSeller = 'MARIELLEE';
  
  try {
    console.log('🔍 Recherche des ventes pour l\'utilisateur:', userId);
    console.log('📝 user_seller correct à appliquer:', correctUserSeller);
    console.log('');
    
    // Récupérer toutes les ventes
    const allSales = await databases.listDocuments(
      DATABASE_ID,
      SALES_COLLECTION_ID
    );
    
    console.log(`📊 Total des ventes dans la base: ${allSales.documents.length}`);
    
    // Filtrer les ventes de cet utilisateur
    const userSales = allSales.documents.filter(sale => sale.userId === userId);
    
    console.log(`🎯 Ventes trouvées pour l'utilisateur ${userId}: ${userSales.length}`);
    console.log('');
    
    if (userSales.length === 0) {
      console.log('ℹ️  Aucune vente trouvée pour cet utilisateur.');
      return;
    }
    
    let updatedCount = 0;
    let alreadyCorrectCount = 0;
    
    // Traiter chaque vente de l'utilisateur
    for (let i = 0; i < userSales.length; i++) {
      const sale = userSales[i];
      const progress = `[${i + 1}/${userSales.length}]`;
      
      console.log(`${progress} 🔍 Vente ${sale.$id.substring(0, 8)}:`);
      console.log(`   - user_seller actuel: '${sale.user_seller || 'Non défini'}'`);
      console.log(`   - userId: ${sale.userId}`);
      console.log(`   - Date: ${new Date(sale.$createdAt).toLocaleDateString('fr-FR')}`);
      
      if (sale.user_seller === correctUserSeller) {
        console.log(`   ✅ Déjà correct`);
        alreadyCorrectCount++;
      } else {
        try {
          // Mettre à jour la vente
          await databases.updateDocument(
            DATABASE_ID,
            SALES_COLLECTION_ID,
            sale.$id,
            {
              user_seller: correctUserSeller
            }
          );
          
          console.log(`   🔄 Mis à jour: '${sale.user_seller || 'Non défini'}' → '${correctUserSeller}'`);
          updatedCount++;
        } catch (updateError) {
          console.error(`   ❌ Erreur lors de la mise à jour:`, updateError.message);
        }
      }
      
      console.log('');
    }
    
    console.log('📈 Résumé de la correction:');
    console.log(`   - Ventes mises à jour: ${updatedCount}`);
    console.log(`   - Ventes déjà correctes: ${alreadyCorrectCount}`);
    console.log(`   - Total traité: ${updatedCount + alreadyCorrectCount}/${userSales.length}`);
    
    if (updatedCount > 0) {
      console.log('\n✅ Correction terminée avec succès!');
      console.log(`🎯 Toutes les ventes de l'utilisateur ${userId} ont maintenant le user_seller '${correctUserSeller}'`);
    } else {
      console.log('\nℹ️  Aucune mise à jour nécessaire, toutes les ventes étaient déjà correctes.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message);
    if (error.response) {
      console.error('📋 Détails de l\'erreur:', error.response);
    }
    process.exit(1);
  }
}

// Vérification des variables d'environnement
if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ Variable d\'environnement APPWRITE_API_KEY manquante.');
  process.exit(1);
}

// Exécuter le script
fixUserSellerForSpecificUser();

