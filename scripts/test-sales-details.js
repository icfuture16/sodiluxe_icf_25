const { Client, Databases, Query } = require('node-appwrite');

// Constantes Appwrite
const DATABASE_ID = '68599714002eef233c16';
const COLLECTIONS = {
  SALES: 'sales',
  SALE_ITEMS: 'sale_items'
};

// Configuration Appwrite
const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6856f8aa00281cb47665')
  .setKey('standard_4c24e91366984ffd2c2c09a0ed2d3527382fde636b7ea60c867a10467fb58ec942be378668988ad3cdc4993bf2f6839e75a7467b0771f3c8e899d0f1b3b063946c7ef195972d58310ccbbf899423fdd94ceda4b1e3a88c8c691d716e105890966f552b942cdf76360ae311305dae2559d92afe1ab64367f927af580263d63dc2');

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