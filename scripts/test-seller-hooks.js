/**
 * Script de test pour vérifier les hooks de statistiques des vendeurs
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

// Simuler le comportement du hook useSellerSales
async function testSellerSales(sellerId, month = null) {
  try {
    console.log(`\n🧪 Test useSellerSales pour sellerId: ${sellerId}, month: ${month}`);
    
    if (!sellerId) {
      console.log('❌ Pas de sellerId fourni');
      return {
        sales: [],
        totalRevenue: 0,
        salesCount: 0,
        averageTicket: 0
      };
    }

    const shouldFilterByMonth = month !== null;
    console.log(`   📅 Filtrage par mois: ${shouldFilterByMonth}`);
    
    // Récupérer les ventes du vendeur
    const queries = [
      Query.equal('userId', sellerId),
      Query.equal('status', 'completed'), // Seulement les ventes complétées
      Query.orderDesc('$createdAt')
    ];
    
    console.log(`   🔍 Requêtes: ${JSON.stringify(queries, null, 2)}`);
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SALES,
      queries
    );
    
    const sales = response.documents;
    console.log(`   📊 Ventes trouvées: ${sales.length}`);
    
    if (sales.length > 0) {
      console.log(`   💰 Première vente:`, {
        id: sales[0].$id,
        userId: sales[0].userId,
        status: sales[0].status,
        totalAmount: sales[0].totalAmount,
        createdAt: sales[0].$createdAt
      });
    }
    
    // Calculer les statistiques
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const salesCount = sales.length;
    const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0;
    
    const result = {
      sales,
      totalRevenue,
      salesCount,
      averageTicket
    };
    
    console.log(`   ✅ Résultat:`, {
      totalRevenue,
      salesCount,
      averageTicket
    });
    
    return result;
    
  } catch (error) {
    console.error(`❌ Erreur dans testSellerSales:`, error.message);
    throw error;
  }
}

// Simuler le comportement du hook useAllSellerStats
async function testAllSellerStats() {
  try {
    console.log('\n🔍 === TEST DU HOOK useAllSellerStats ===\n');
    
    // 1. Récupérer les utilisateurs vendeurs
    console.log('👥 1. Récupération des vendeurs...');
    const usersResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [Query.equal('role', 'seller')]
    );
    
    const sellers = usersResponse.documents;
    console.log(`   ✅ ${sellers.length} vendeurs trouvés`);
    
    if (sellers.length === 0) {
      console.log('   ⚠️  Aucun vendeur trouvé!');
      return;
    }
    
    // 2. Tester useSellerSales pour chaque vendeur
    console.log('\n📊 2. Test des statistiques pour chaque vendeur...');
    
    const allSellerStats = [];
    
    for (const seller of sellers) {
      console.log(`\n   👤 Vendeur: ${seller.fullName} (${seller.$id})`);
      
      const sellerData = await testSellerSales(seller.$id, null);
      
      const stats = {
        userId: seller.$id,
        fullName: seller.fullName,
        email: seller.email,
        role: seller.role,
        totalRevenue: sellerData.totalRevenue,
        salesCount: sellerData.salesCount,
        averageTicket: sellerData.averageTicket
      };
      
      allSellerStats.push(stats);
      
      console.log(`      💰 CA: ${stats.totalRevenue.toLocaleString()} FCFA`);
      console.log(`      📈 Ventes: ${stats.salesCount}`);
      console.log(`      🎯 Ticket moyen: ${stats.averageTicket.toLocaleString()} FCFA`);
    }
    
    // 3. Calculer les tops
    console.log('\n🏆 3. Calcul des tops...');
    
    const topSellers = allSellerStats
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 3);
    
    const atRiskSellers = allSellerStats
      .filter(stat => stat.salesCount === 0)
      .slice(0, 3);
    
    console.log('\n📈 Top 3 des meilleurs vendeurs:');
    topSellers.forEach((seller, index) => {
      console.log(`   ${index + 1}. ${seller.fullName}: ${seller.totalRevenue.toLocaleString()} FCFA (${seller.salesCount} ventes)`);
    });
    
    console.log('\n⚠️  Vendeurs à risque:');
    if (atRiskSellers.length > 0) {
      atRiskSellers.forEach((seller, index) => {
        console.log(`   ${index + 1}. ${seller.fullName}: ${seller.totalRevenue.toLocaleString()} FCFA (${seller.salesCount} ventes)`);
      });
    } else {
      console.log('   ✅ Aucun vendeur à risque');
    }
    
    return {
      sellerStats: allSellerStats,
      topSellers,
      riskSellers: atRiskSellers
    };
    
  } catch (error) {
    console.error('❌ Erreur dans testAllSellerStats:', error.message);
    throw error;
  }
}

// Exécuter les tests
async function runTests() {
  try {
    await testAllSellerStats();
    
    console.log('\n🎯 === TESTS TERMINÉS ===');
    console.log('Si les données sont correctes ici mais pas dans l\'interface,');
    console.log('le problème vient probablement de l\'authentification ou du rendu React.');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter le script
if (require.main === module) {
  runTests();
}

module.exports = { testSellerSales, testAllSellerStats };

