const { Client, Databases, Query } = require('node-appwrite')

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const databases = new Databases(client)
const DATABASE_ID = '68599714002eef233c16'

async function migrateDebitSalesToSales() {
  try {
    console.log('Début de la migration des ventes débitrices...')
    
    // 1. Récupérer toutes les ventes débitrices
    const debitSales = await databases.listDocuments(
      DATABASE_ID,
      'debit_sales',
      [Query.limit(1000)]
    )
    
    console.log(`${debitSales.documents.length} ventes débitrices à migrer`)
    
    // 2. Migrer chaque vente débitrice vers la collection sales
    for (const debitSale of debitSales.documents) {
      const saleData = {
        clientId: debitSale.clientId,
        storeId: debitSale.storeId,
        userId: debitSale.userId,
        sellerId: debitSale.sellerId,
        user_seller: debitSale.user_seller,
        totalAmount: debitSale.totalAmount,
        discountAmount: debitSale.discountAmount || 0,
        paymentMethod: debitSale.paymentMethod,
        saleDate: debitSale.saleDate,
        status: debitSale.status,
        
        // Marquer comme vente à crédit
        isCredit: true,
        paidAmount: debitSale.paidAmount,
        remainingAmount: debitSale.totalAmount - debitSale.paidAmount,
        
        // Copier les champs de paiement
        payment_especes: debitSale.payment_especes,
        payment_carte: debitSale.payment_carte,
        payment_wave: debitSale.payment_wave,
        payment_orange_money: debitSale.payment_orange_money,
        payment_cheque: debitSale.payment_cheque,
        payment_cheque_cadeau: debitSale.payment_cheque_cadeau,
        payment_virement: debitSale.payment_virement,
        
        // Champs spécifiques aux ventes à crédit
        initialPayment: debitSale.initialPayment,
        guarantorName: debitSale.guarantorName,
        guarantorContact: debitSale.guarantorContact,
        guarantorRelation: debitSale.guarantorRelation,
        numberOfInstallments: debitSale.numberOfInstallments,
        
        loyaltyPointsEarned: debitSale.loyaltyPointsEarned,
        loyaltyPointsUsed: debitSale.loyaltyPointsUsed,
        notes: debitSale.notes
      }
      
      // Créer la vente dans la collection sales
      await databases.createDocument(
        DATABASE_ID,
        'sales',
        debitSale.$id, // Garder le même ID
        saleData
      )
      
      console.log(`Vente débitrice ${debitSale.$id} migrée`)
    }
    
    // 3. Migrer les items des ventes débitrices
    const debitSaleItems = await databases.listDocuments(
      DATABASE_ID,
      'debit_sale_items',
      [Query.limit(1000)]
    )
    
    console.log(`${debitSaleItems.documents.length} items de ventes débitrices à migrer`)
    
    for (const item of debitSaleItems.documents) {
      const itemData = {
        saleId: item.debitSaleId, // Changer debitSaleId en saleId
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount || 0
      }
      
      await databases.createDocument(
        DATABASE_ID,
        'sale_items',
        item.$id, // Garder le même ID
        itemData
      )
      
      console.log(`Item ${item.$id} migré`)
    }
    
    console.log('Migration terminée avec succès!')
    
  } catch (error) {
    console.error('Erreur lors de la migration:', error)
  }
}

migrateDebitSalesToSales()