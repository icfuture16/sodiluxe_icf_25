const { Client, Databases, Query } = require('node-appwrite');

// Constantes Appwrite
const DATABASE_ID = '68599714002eef233c16';
const COLLECTIONS = {
  SALES: 'sales',
  SALE_ITEMS: 'sale_items',
  PRODUCTS: 'products',
  CLIENTS: 'clients',
  STORES: 'stores',
  USERS: 'users'
};

// Configuration Appwrite
const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6856f8aa00281cb47665')
  .setKey('standard_4c24e91366984ffd2c2c09a0ed2d3527382fde636b7ea60c867a10467fb58ec942be378668988ad3cdc4993bf2f6839e75a7467b0771f3c8e899d0f1b3b063946c7ef195972d58310ccbbf899423fdd94ceda4b1e3a88c8c691d716e105890966f552b942cdf76360ae311305dae2559d92afe1ab64367f927af580263d63dc2');

const databases = new Databases(client);

async function debugSaleDetails(saleId) {
  try {
    console.log(`\n=== DÉBOGAGE DÉTAILS VENTE ${saleId} ===\n`);
    
    // 1. Récupérer la vente
    console.log('1. Récupération de la vente...');
    const sale = await databases.getDocument(DATABASE_ID, COLLECTIONS.SALES, saleId);
    console.log('✅ Vente récupérée:', {
      id: sale.$id,
      clientId: sale.clientId,
      storeId: sale.storeId,
      sellerId: sale.sellerId,
      user_seller: sale.user_seller,
      totalAmount: sale.totalAmount,
      status: sale.status,
      saleDate: sale.saleDate
    });

    // 2. Récupérer les articles de vente
    console.log('\n2. Récupération des articles de vente...');
    const saleItems = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SALE_ITEMS,
      [Query.equal('saleId', saleId)]
    );
    console.log(`✅ ${saleItems.documents.length} articles trouvés`);
    
    for (const item of saleItems.documents) {
      console.log(`  - Article: ${item.productId}, Qté: ${item.quantity}, Prix: ${item.unitPrice}`);
      
      // Récupérer les détails du produit
      try {
        const product = await databases.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, item.productId);
        console.log(`    Produit: ${product.name}`);
      } catch (err) {
        console.log(`    ❌ Erreur produit: ${err.message}`);
      }
    }

    // 3. Récupérer le client
    console.log('\n3. Récupération du client...');
    if (sale.clientId) {
      try {
        const client = await databases.getDocument(DATABASE_ID, COLLECTIONS.CLIENTS, sale.clientId);
        console.log('✅ Client récupéré:', {
          id: client.$id,
          fullName: client.fullName,
          email: client.email,
          phone: client.phone
        });
      } catch (err) {
        console.log(`❌ Erreur client: ${err.message}`);
      }
    } else {
      console.log('⚠️  Pas de clientId dans la vente');
    }

    // 4. Récupérer le magasin
    console.log('\n4. Récupération du magasin...');
    if (sale.storeId) {
      try {
        const store = await databases.getDocument(DATABASE_ID, COLLECTIONS.STORES, sale.storeId);
        console.log('✅ Magasin récupéré:', {
          id: store.$id,
          name: store.name,
          phone: store.phone
        });
      } catch (err) {
        console.log(`❌ Erreur magasin: ${err.message}`);
      }
    } else {
      console.log('⚠️  Pas de storeId dans la vente');
    }

    // 5. Récupérer le vendeur
    console.log('\n5. Récupération du vendeur...');
    if (sale.sellerId) {
      try {
        const seller = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, sale.sellerId);
        console.log('✅ Vendeur récupéré:', {
          id: seller.$id,
          fullName: seller.fullName,
          email: seller.email
        });
      } catch (err) {
        console.log(`❌ Erreur vendeur: ${err.message}`);
      }
    } else if (sale.user_seller) {
      console.log(`⚠️  Pas de sellerId, mais user_seller: ${sale.user_seller}`);
    } else {
      console.log('⚠️  Pas de sellerId ni user_seller dans la vente');
    }

    console.log('\n=== FIN DU DÉBOGAGE ===\n');
    
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error);
  }
}

// Tester avec l'ID de vente trouvé précédemment
const saleId = process.argv[2] || '689931db85446081688a';
debugSaleDetails(saleId);