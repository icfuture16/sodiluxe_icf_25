const { Client, Databases, Query } = require('node-appwrite');
const { DATABASE_ID, COLLECTIONS, ENDPOINT, PROJECT_ID } = require('./appwrite-config');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

// Configuration Appwrite
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function testFinalStats() {
  console.log('🔍 === TEST FINAL DES STATISTIQUES ===\n');

  try {
    // 1. Récupérer tous les utilisateurs
    console.log('👥 1. Récupération des utilisateurs...');
    const usersResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS
    );
    
    const users = usersResponse.documents;
    console.log(`   ✅ ${users.length} utilisateurs trouvés\n`);

    // 2. Filtrer les vendeurs
    const sellers = users.filter(user => user.role === 'seller');
    console.log(`📊 2. Vendeurs identifiés: ${sellers.length}`);
    
    sellers.forEach(seller => {
      console.log(`   - ${seller.fullName} (${seller.$id})`);
    });
    console.log('');

    // 3. Calculer les statistiques pour chaque vendeur
    console.log('💰 3. Calcul des statistiques par vendeur...');
    
    const sellerStats = [];
    
    for (const seller of sellers) {
      // Récupérer les ventes du vendeur (statut completed)
      const salesResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SALES,
        [
          Query.equal('userId', seller.$id),
          Query.equal('status', 'completed'),
          Query.orderDesc('$createdAt')
        ]
      );
      
      const sales = salesResponse.documents;
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const salesCount = sales.length;
      const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0;
      
      const stats = {
        userId: seller.$id,
        fullName: seller.fullName,
        email: seller.email,
        role: seller.role,
        totalRevenue,
        salesCount,
        averageTicket
      };
      
      sellerStats.push(stats);
      
      console.log(`   👤 ${seller.fullName}:`);
      console.log(`      💰 CA: ${formatCurrency(totalRevenue)}`);
      console.log(`      📈 Ventes: ${salesCount}`);
      console.log(`      🎯 Ticket moyen: ${formatCurrency(averageTicket)}`);
      console.log('');
    }

    // 4. Calculer les tops
    console.log('🏆 4. Calcul des tops...');
    
    const topSellers = sellerStats
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 3);
    
    const riskSellers = sellerStats
      .filter(stat => stat.salesCount === 0)
      .slice(0, 3);
    
    console.log('\n📈 Top 3 des meilleurs vendeurs:');
    if (topSellers.length > 0) {
      topSellers.forEach((seller, index) => {
        console.log(`   ${index + 1}. ${seller.fullName}: ${formatCurrency(seller.totalRevenue)} (${seller.salesCount} ventes)`);
      });
    } else {
      console.log('   ✅ Aucun vendeur avec des ventes');
    }
    
    console.log('\n⚠️  Vendeurs à risque:');
    if (riskSellers.length > 0) {
      riskSellers.forEach((seller, index) => {
        console.log(`   ${index + 1}. ${seller.fullName}: ${formatCurrency(seller.totalRevenue)} (${seller.salesCount} ventes)`);
      });
    } else {
      console.log('   ✅ Aucun vendeur à risque');
    }

    // 5. Simuler la fonction getUserStats de la page
    console.log('\n🔍 5. Test de la fonction getUserStats...');
    
    function getUserStats(userId) {
      const stats = sellerStats.find(s => s.userId === userId);
      return stats || { totalRevenue: 0, salesCount: 0 };
    }
    
    // Tester pour chaque utilisateur
    users.forEach(user => {
      if (user.role === 'seller') {
        const stats = getUserStats(user.$id);
        console.log(`   👤 ${user.fullName} (vendeur):`);
        console.log(`      💰 CA affiché: ${formatCurrency(stats.totalRevenue)}`);
        console.log(`      📈 Ventes affichées: ${stats.salesCount}`);
      } else {
        console.log(`   👤 ${user.fullName} (${user.role}): - (pas de stats)`);
      }
    });

    console.log('\n🎯 === TESTS TERMINÉS ===');
    console.log('Si ces données sont correctes, le problème est résolu!');
    console.log('Vérifiez maintenant l\'interface web à http://localhost:3000/admin/users');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('XOF', 'FCFA');
}

testFinalStats();

