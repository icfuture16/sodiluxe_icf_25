/**
 * Script pour migrer les données de debit_sales vers sales
 * Ce script transfère toutes les ventes débitrices vers la collection sales unifiée
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Databases, Query } = require('node-appwrite');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Vérification des variables d'environnement requises
if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
  console.error('Erreur: Variables d\'environnement manquantes.');
  console.error('Veuillez définir les variables suivantes dans le fichier .env.local:');
  console.error('- NEXT_PUBLIC_APPWRITE_ENDPOINT');
  console.error('- NEXT_PUBLIC_APPWRITE_PROJECT_ID');
  console.error('- APPWRITE_API_KEY');
  process.exit(1);
}

// Configuration du client Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Fonction pour récupérer toutes les ventes débitrices
async function getAllDebitSales() {
  try {
    console.log('Récupération des ventes débitrices...');
    
    let allDebitSales = [];
    let offset = 0;
    const limit = 100; // Traiter par lots de 100
    
    while (true) {
      const response = await databases.listDocuments(
        DATABASE_ID,
        'debit_sales',
        [
          Query.limit(limit),
          Query.offset(offset)
        ]
      );
      
      if (response.documents.length === 0) {
        break;
      }
      
      allDebitSales = allDebitSales.concat(response.documents);
      offset += limit;
      
      console.log(`  - Récupéré ${response.documents.length} ventes débitrices (total: ${allDebitSales.length})`);
    }
    
    console.log(`✓ Total des ventes débitrices récupérées: ${allDebitSales.length}`);
    return allDebitSales;
    
  } catch (error) {
    if (error.code === 404) {
      console.log('✓ Aucune collection debit_sales trouvée ou vide.');
      return [];
    }
    throw error;
  }
}

// Fonction pour mapper une vente débitrice vers le format sales unifié
function mapDebitSaleToSale(debitSale) {
  // Calculer le montant total et les montants payés/restants
  const totalAmount = debitSale.totalAmount || 0;
  const paidAmount = debitSale.paidAmount || 0;
  const remainingAmount = totalAmount - paidAmount;
  
  // Créer l'objet de vente unifié
  const unifiedSale = {
    // Champs requis
    clientId: debitSale.clientId,
    storeId: debitSale.storeId,
    userId: debitSale.sellerId, // Mapper sellerId vers userId
    totalAmount: totalAmount,
    discountAmount: debitSale.discountAmount || 0,
    status: debitSale.status,
    
    // Champs optionnels existants
    saleDate: debitSale.date ? debitSale.date.split('T')[0] : null, // Format YYYY-MM-DD
    customerId: null,
    date: null,
    items: [],
    notes: debitSale.notes || null,
    paymentMethod: debitSale.paymentMethod || 'especes',
    user_seller: debitSale.sellerId,
    
    // Détails des paiements par méthode (valeurs par défaut comme dans sales)
    payment_wave: "0",
    payment_especes: String(debitSale.payment_especes || 0),
    payment_cheque: String(debitSale.payment_cheque || 0),
    payment_virement: String(debitSale.payment_virement || 0),
    payment_carte: String(debitSale.payment_carte || 0),
    payment_cheque_cadeau: "0",
    payment_orange_money: "0",
    payment_mobile: debitSale.payment_mobile || 0,
     payment_credit: debitSale.payment_credit || 0,
     payment_autre: debitSale.payment_autre || 0,
    
    // Nouveau champ pour identifier les ventes à crédit
    isCredit: true,
    
    // Champs spécifiques aux ventes à crédit
    paidAmount: paidAmount,
    remainingAmount: remainingAmount,
    initialPayment: debitSale.initialPayment || paidAmount,
    numberOfInstallments: debitSale.numberOfInstallments || 1,
    
    // Informations du garant
    guarantorName: debitSale.guarantorName || null,
    guarantorContact: debitSale.guarantorContact || null,
    guarantorRelation: debitSale.guarantorRelation || null,
    
    // Points de fidélité
    loyaltyPointsEarned: debitSale.loyaltyPointsEarned || null,
    loyaltyPointsUsed: debitSale.loyaltyPointsUsed || null
  };
  
  return unifiedSale;
}

// Fonction pour créer une vente dans la collection sales
async function createSaleInUnifiedCollection(saleData) {
  try {
    const result = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.SALES,
      'unique()',
      saleData
    );
    return result;
  } catch (error) {
    console.error(`Erreur lors de la création de la vente:`, error.message);
    throw error;
  }
}

// Fonction pour migrer les items de vente débitrice
async function migrateDebitSaleItems(originalDebitSaleId, newSaleId) {
  try {
    // Récupérer les items de la vente débitrice
    const itemsResponse = await databases.listDocuments(
      DATABASE_ID,
      'debit_sale_items',
      [
        Query.equal('debitSaleId', originalDebitSaleId)
      ]
    );
    
    // Migrer chaque item vers sale_items
    for (const item of itemsResponse.documents) {
      const newItem = {
        saleId: newSaleId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discount: item.discount || 0
      };
      
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SALE_ITEMS,
        'unique()',
        newItem
      );
    }
    
    return itemsResponse.documents.length;
  } catch (error) {
    if (error.code === 404) {
      // Collection debit_sale_items n'existe pas ou pas d'items
      return 0;
    }
    throw error;
  }
}

// Fonction principale de migration
async function migrateDebitSalesToSales() {
  try {
    console.log('Migration des ventes débitrices vers la collection sales unifiée');
    console.log('='.repeat(70));
    
    // Vérifier que les collections existent
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.SALES);
      console.log('✓ Collection sales trouvée');
    } catch (error) {
      console.error('✗ Collection sales non trouvée. Veuillez d\'abord créer la collection.');
      process.exit(1);
    }
    
    // Récupérer toutes les ventes débitrices
    const debitSales = await getAllDebitSales();
    
    if (debitSales.length === 0) {
      console.log('✓ Aucune vente débitrice à migrer.');
      return;
    }
    
    console.log(`\nMigration de ${debitSales.length} ventes débitrices...`);
    
    let migratedCount = 0;
    let itemsMigratedCount = 0;
    const errors = [];
    
    // Migrer chaque vente débitrice
    for (const debitSale of debitSales) {
      try {
        console.log(`  - Migration de la vente ${debitSale.$id}...`);
        
        // Mapper vers le format unifié
        const unifiedSale = mapDebitSaleToSale(debitSale);
        
        // Créer dans la collection sales
        const newSale = await createSaleInUnifiedCollection(unifiedSale);
        
        // Migrer les items associés
        const itemsCount = await migrateDebitSaleItems(debitSale.$id, newSale.$id);
        itemsMigratedCount += itemsCount;
        
        migratedCount++;
        console.log(`    ✓ Vente migrée avec ${itemsCount} items`);
        
        // Petite pause pour éviter les limitations de taux
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`    ✗ Erreur lors de la migration de la vente ${debitSale.$id}:`, error.message);
        errors.push({ saleId: debitSale.$id, error: error.message });
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 Résumé de la migration:');
    console.log(`✅ Ventes migrées avec succès: ${migratedCount}/${debitSales.length}`);
    console.log(`✅ Items migrés: ${itemsMigratedCount}`);
    
    if (errors.length > 0) {
      console.log(`❌ Erreurs rencontrées: ${errors.length}`);
      console.log('\nDétails des erreurs:');
      errors.forEach(err => {
        console.log(`  - Vente ${err.saleId}: ${err.error}`);
      });
    }
    
    if (migratedCount === debitSales.length) {
      console.log('\n🎉 Migration terminée avec succès!');
      console.log('\nÉtapes suivantes:');
      console.log('1. Vérifier les données migrées dans la collection sales');
      console.log('2. Mettre à jour le code pour utiliser la collection unifiée');
      console.log('3. Supprimer les anciennes collections debit_sales et debit_sale_items');
    } else {
      console.log('\n⚠️  Migration partiellement terminée.');
      console.log('Veuillez corriger les erreurs et relancer le script si nécessaire.');
    }
    
  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ Erreur critique lors de la migration:', error.message);
    console.error('\nVeuillez vérifier:');
    console.error('- Que les variables d\'environnement sont correctement configurées');
    console.error('- Que la clé API a les permissions nécessaires');
    console.error('- Que les collections existent');
    process.exit(1);
  }
}

// Exécuter la migration
migrateDebitSalesToSales().catch(error => {
  console.error('Erreur inattendue:', error);
  process.exit(1);
});