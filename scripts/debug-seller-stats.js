/**
 * Script de débogage pour vérifier les statistiques des vendeurs
 * Vérifie s'il y a des ventes dans la base de données et les informations des vendeurs
 */

const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { DATABASE_ID, PROJECT_ID, ENDPOINT, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Fonction pour déboguer les statistiques des vendeurs
async function debugSellerStats() {
  try {
    console.log('🔍 === DÉBOGAGE DES STATISTIQUES DES VENDEURS ===\n');
    
    // 1. Vérifier les utilisateurs vendeurs
    console.log('👥 1. Récupération des utilisateurs vendeurs...');
    const usersResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [Query.equal('role', 'seller')]
    );
    
    console.log(`   ✅ ${usersResponse.documents.length} vendeurs trouvés:`);
    usersResponse.documents.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.fullName} (${user.$id}) - ${user.email}`);
    });
    console.log('');
    
    // 2. Vérifier toutes les ventes
    console.log('💰 2. Récupération de toutes les ventes...');
    const allSalesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SALES,
      [Query.orderDesc('$createdAt')]
    );
    
    console.log(`   ✅ ${allSalesResponse.documents.length} ventes trouvées au total`);
    
    if (allSalesResponse.documents.length === 0) {
      console.log('   ⚠️  AUCUNE VENTE TROUVÉE - C\'est pourquoi les statistiques sont à zéro!');
      return;
    }
    
    // 3. Analyser les ventes par vendeur
    console.log('\n📊 3. Analyse des ventes par vendeur...');
    
    const sellerStats = {};
    
    allSalesResponse.documents.forEach(sale => {
      const sellerId = sale.userId;
      const amount = sale.totalAmount || 0;
      const status = sale.status;
      
      if (!sellerStats[sellerId]) {
        sellerStats[sellerId] = {
          totalSales: 0,
          completedSales: 0,
          totalRevenue: 0,
          completedRevenue: 0,
          sales: []
        };
      }
      
      sellerStats[sellerId].totalSales++;
      sellerStats[sellerId].sales.push({
        id: sale.$id,
        amount: amount,
        status: status,
        date: sale.saleDate || sale.$createdAt
      });
      
      if (status === 'completed') {
        sellerStats[sellerId].completedSales++;
        sellerStats[sellerId].completedRevenue += amount;
      }
      
      sellerStats[sellerId].totalRevenue += amount;
    });
    
    // 4. Afficher les statistiques détaillées
    console.log('\n📈 4. Statistiques détaillées par vendeur:');
    
    for (const [sellerId, stats] of Object.entries(sellerStats)) {
      // Trouver le nom du vendeur
      const seller = usersResponse.documents.find(u => u.$id === sellerId);
      const sellerName = seller ? seller.fullName : `Vendeur inconnu (${sellerId})`;
      
      console.log(`\n   👤 ${sellerName}:`);
      console.log(`      - ID: ${sellerId}`);
      console.log(`      - Ventes totales: ${stats.totalSales}`);
      console.log(`      - Ventes complétées: ${stats.completedSales}`);
      console.log(`      - CA total: ${stats.totalRevenue.toLocaleString()} FCFA`);
      console.log(`      - CA complété: ${stats.completedRevenue.toLocaleString()} FCFA`);
      
      if (stats.sales.length > 0) {
        console.log(`      - Dernières ventes:`);
        stats.sales.slice(0, 3).forEach(sale => {
          console.log(`        * ${sale.id}: ${sale.amount.toLocaleString()} FCFA (${sale.status}) - ${sale.date}`);
        });
      }
    }
    
    // 5. Vérifier les ventes complétées spécifiquement
    console.log('\n✅ 5. Vérification des ventes complétées...');
    const completedSalesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SALES,
      [Query.equal('status', 'completed')]
    );
    
    console.log(`   ✅ ${completedSalesResponse.documents.length} ventes complétées trouvées`);
    
    if (completedSalesResponse.documents.length === 0) {
      console.log('   ⚠️  AUCUNE VENTE COMPLÉTÉE - Le hook useSellerSales filtre sur status="completed"!');
      console.log('   💡 Vérifiez que vos ventes ont bien le statut "completed"');
    }
    
    // 6. Tester une requête similaire au hook
    console.log('\n🔧 6. Test d\'une requête similaire au hook useSellerSales...');
    
    if (usersResponse.documents.length > 0) {
      const testSellerId = usersResponse.documents[0].$id;
      const testSellerName = usersResponse.documents[0].fullName;
      
      console.log(`   🧪 Test pour le vendeur: ${testSellerName} (${testSellerId})`);
      
      const testSalesResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SALES,
        [
          Query.equal('userId', testSellerId),
          Query.equal('status', 'completed'),
          Query.orderDesc('$createdAt')
        ]
      );
      
      console.log(`   📊 Résultat: ${testSalesResponse.documents.length} ventes complétées trouvées`);
      
      if (testSalesResponse.documents.length > 0) {
        const totalRevenue = testSalesResponse.documents.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
        console.log(`   💰 CA calculé: ${totalRevenue.toLocaleString()} FCFA`);
      } else {
        console.log('   ⚠️  Aucune vente complétée pour ce vendeur');
      }
    }
    
    console.log('\n🎯 === RÉSUMÉ DU DIAGNOSTIC ===');
    console.log(`- Vendeurs dans la base: ${usersResponse.documents.length}`);
    console.log(`- Ventes totales: ${allSalesResponse.documents.length}`);
    console.log(`- Ventes complétées: ${completedSalesResponse.documents.length}`);
    
    if (completedSalesResponse.documents.length === 0) {
      console.log('\n❌ PROBLÈME IDENTIFIÉ: Aucune vente avec le statut "completed"');
      console.log('💡 SOLUTION: Vérifiez que vos ventes ont bien le statut "completed" dans la base de données');
    } else {
      console.log('\n✅ Des ventes complétées existent, le problème pourrait être ailleurs');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le script
if (require.main === module) {
  debugSellerStats();
}

module.exports = { debugSellerStats };