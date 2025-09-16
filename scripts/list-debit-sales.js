const { Client, Databases, Query } = require('node-appwrite');

// Configuration Appwrite
const client = new Client();
client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68bf1c29001d20f7444d')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

async function listDebitSales() {
  try {
    console.log('📥 Récupération des ventes débitrices...');
    console.log('   - Database ID: 68bf1e7b003c6b340d6e');
    console.log('   - Collection ID: debit_sales');
    console.log('');

    const response = await databases.listDocuments(
      '68bf1e7b003c6b340d6e',
      'debit_sales',
      [Query.limit(25), Query.orderDesc('$createdAt')]
    );

    console.log(`✅ ${response.total} ventes débitrices trouvées:`);
    console.log('');

    response.documents.forEach((sale, index) => {
      console.log(`${index + 1}. ID: ${sale.$id}`);
      console.log(`   - Date: ${sale.saleDate || sale.$createdAt}`);
      console.log(`   - Client ID: ${sale.clientId}`);
      console.log(`   - Vendeur ID: ${sale.userId}`);
      console.log(`   - Montant total: ${sale.totalAmount}`);
      console.log(`   - Montant payé: ${sale.paidAmount}`);
      console.log(`   - Montant restant: ${sale.remainingAmount}`);
      console.log(`   - Statut: ${sale.status}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des ventes débitrices:', error.message);
    if (error.code) {
      console.error('   Code d\'erreur:', error.code);
    }
  }
}

listDebitSales();

