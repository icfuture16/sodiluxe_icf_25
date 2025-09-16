const { Client, Databases, Query } = require('node-appwrite');

// Constantes Appwrite
const DATABASE_ID = '68bf1e7b003c6b340d6e';
const COLLECTIONS = {
  SALES: 'sales',
  SALE_ITEMS: 'sale_items'
};

// Configuration Appwrite
const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68bf1c29001d20f7444d')
  .setKey('standard_7c860836bcc01137b6f2bac843cb0996bdb7d67d58e613ee92b26122296b0b7b42da7bbee2748b0b15c86f672a56e59ef5ebc21946625940759df6dc5396d43d0fb84c7535b3789f0ff54bc125305d06936ea9cbefec68dd0714dac4889fbeb630687ad2873aea1050bec1140c600a89d14e6cdfdffc6203509b14de4d897ad3');

const databases = new Databases(client);

async function testSalesDetails() {
  try {
    console.log('Test des détails des ventes...');
    
    // Récupérer quelques ventes
    const salesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SALES,
      [
        Query.limit(5),
        Query.orderDesc('$createdAt')
      ]
    );

    console.log(`Trouvé ${salesResponse.documents.length} ventes.`);

    for (const sale of salesResponse.documents) {
      console.log(`\n--- Vente ID: ${sale.$id} ---`);
      console.log(`Client: ${sale.client?.fullName || 'N/A'}`);
      console.log(`Montant: ${sale.totalAmount}`);
      console.log(`Date: ${sale.saleDate || sale.$createdAt}`);
      console.log(`Statut: ${sale.status}`);
      
      // Tester la récupération des articles de vente
      try {
        const itemsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SALE_ITEMS,
          [Query.equal('saleId', sale.$id)]
        );
        console.log(`Articles trouvés: ${itemsResponse.documents.length}`);
        
        if (itemsResponse.documents.length === 0) {
          console.log('⚠️  PROBLÈME: Aucun article trouvé pour cette vente!');
        }
      } catch (error) {
        console.log('❌ ERREUR lors de la récupération des articles:', error.message);
      }
    }

    // Tester la récupération d'une vente spécifique
    if (salesResponse.documents.length > 0) {
      const firstSale = salesResponse.documents[0];
      console.log(`\n--- Test de récupération de la vente ${firstSale.$id} ---`);
      
      try {
        const saleDetail = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.SALES,
          firstSale.$id
        );
        console.log('✅ Vente récupérée avec succès');
        console.log('URL de test:', `http://localhost:3000/ventes/details/${firstSale.$id}`);
      } catch (error) {
        console.log('❌ ERREUR lors de la récupération de la vente:', error.message);
      }
    }

  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

// Exécuter le test
testSalesDetails();

