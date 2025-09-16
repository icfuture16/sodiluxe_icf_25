const { Client, Databases, Query } = require('node-appwrite');

// Configuration Appwrite
const client = new Client();
client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68bf1c29001d20f7444d')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

const SALE_ID = '689983561f04e79181d1';
const DATABASE_ID = '68bf1e7b003c6b340d6e';

async function convertSaleToDebitSale() {
  try {
    console.log('🔄 Conversion de la vente en vente débitrice...');
    console.log('ID de la vente:', SALE_ID);
    console.log('');

    // 1. Récupérer la vente originale
    console.log('📥 Récupération de la vente originale...');
    const originalSale = await databases.getDocument(
      DATABASE_ID,
      'sales',
      SALE_ID
    );
    console.log('✅ Vente récupérée:', {
      id: originalSale.$id,
      clientId: originalSale.clientId,
      totalAmount: originalSale.totalAmount,
      status: originalSale.status
    });

    // 2. Récupérer les articles de la vente originale
    console.log('📥 Récupération des articles de vente...');
    const saleItemsResponse = await databases.listDocuments(
      DATABASE_ID,
      'sale_items',
      [Query.equal('saleId', SALE_ID)]
    );
    console.log('✅ Articles récupérés:', saleItemsResponse.documents.length, 'articles');

    // 3. Créer la vente débitrice
    console.log('📝 Création de la vente débitrice...');
    const debitSaleData = {
      clientId: originalSale.clientId,
      storeId: originalSale.storeId,
      userId: originalSale.userId,
      totalAmount: originalSale.totalAmount,
      paidAmount: originalSale.status === 'completed' ? originalSale.totalAmount : 0,
      remainingAmount: originalSale.status === 'completed' ? 0 : originalSale.totalAmount,
      discountAmount: originalSale.discountAmount || 0,
      paymentMethod: originalSale.paymentMethod || 'especes',
      status: originalSale.status === 'completed' ? 'completed' : 'pending',
      saleDate: originalSale.saleDate || originalSale.$createdAt,
      // Copier les montants de paiement
      payment_especes: originalSale.payment_especes || "0",
      payment_carte: originalSale.payment_carte || "0",
      payment_wave: originalSale.payment_wave || "0",
      payment_orange_money: originalSale.payment_orange_money || "0",
      payment_cheque: originalSale.payment_cheque || "0",
      payment_cheque_cadeau: originalSale.payment_cheque_cadeau || "0",
      payment_virement: originalSale.payment_virement || "0"
    };

    const debitSale = await databases.createDocument(
      DATABASE_ID,
      'debit_sales',
      SALE_ID, // Utiliser le même ID
      debitSaleData
    );
    console.log('✅ Vente débitrice créée avec ID:', debitSale.$id);

    // 4. Créer les articles de vente débitrice
    console.log('📝 Création des articles de vente débitrice...');
    for (const item of saleItemsResponse.documents) {
      const debitSaleItem = {
        debitSaleId: debitSale.$id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount || 0
      };

      await databases.createDocument(
        DATABASE_ID,
        'debit_sale_items',
        'unique()',
        debitSaleItem
      );
    }
    console.log('✅ Articles de vente débitrice créés:', saleItemsResponse.documents.length, 'articles');

    console.log('');
    console.log('🎉 Conversion terminée avec succès!');
    console.log('La vente', SALE_ID, 'est maintenant disponible comme vente débitrice.');

  } catch (error) {
    console.error('❌ Erreur lors de la conversion:', error.message);
    if (error.code) {
      console.error('   Code d\'erreur:', error.code);
    }
    if (error.type) {
      console.error('   Type d\'erreur:', error.type);
    }
  }
}

convertSaleToDebitSale();

