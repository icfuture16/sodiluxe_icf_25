/**
 * Script pour créer uniquement les collections dans une base de données Appwrite existante
 * Utilise la base de données 'sodiluxe_db' créée manuellement
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.production') });
const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

// Configuration pour la base de données créée manuellement
const DATABASE_ID = '68bf3e6100218f9812ec';
const COLLECTIONS = {
  STORES: 'stores',
  USERS: 'users',
  CLIENTS: 'clients',
  PRODUCTS: 'products',
  SALES: 'sales',
  SALE_ITEMS: 'sale_items',
  RESERVATIONS: 'reservations',
  RESERVATION_ITEMS: 'reservation_items',
  ACCESS_CODES: 'access_codes',
  LOYALTY_HISTORY: 'loyalty_history'
};

// Vérification des variables d'environnement requises
if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
  console.error('❌ Erreur: Variables d\'environnement manquantes.');
  console.error('Veuillez vérifier que les variables suivantes sont définies dans .env.production:');
  console.error('- NEXT_PUBLIC_APPWRITE_ENDPOINT');
  console.error('- NEXT_PUBLIC_APPWRITE_PROJECT_ID');
  console.error('- APPWRITE_API_KEY');
  process.exit(1);
}

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

console.log('🚀 Création des collections dans la base de données sodiluxe_db');
console.log(`📊 Project ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);
console.log(`🗄️  Database ID: ${DATABASE_ID}`);
console.log(`🌐 Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);

// Fonction principale
async function createCollections() {
  try {
    console.log('\n🔍 Vérification de la base de données...');
    
    // Vérifier que la base de données existe
    try {
      const database = await databases.get(DATABASE_ID);
      console.log(`✅ Base de données '${DATABASE_ID}' trouvée:`);
      console.log(`   - Nom: ${database.name}`);
      console.log(`   - Description: ${database.description || 'Aucune description'}`);
    } catch (error) {
      if (error.code === 404) {
        console.error(`❌ La base de données '${DATABASE_ID}' n'existe pas.`);
        console.error('Veuillez d\'abord créer la base de données manuellement dans la console Appwrite.');
        process.exit(1);
      } else {
        console.error('❌ Erreur lors de la vérification:', error.message);
        throw error;
      }
    }

    console.log('\n📋 Création des collections...');
    
    // Créer toutes les collections
    await createStoresCollection();
    await createUsersCollection();
    await createClientsCollection();
    await createProductsCollection();
    await createSalesCollection();
    await createSaleItemsCollection();
    await createReservationsCollection();
    await createReservationItemsCollection();
    await createAccessCodesCollection();
    await createLoyaltyHistoryCollection();

    console.log('\n🎉 Création des collections terminée avec succès!');
    console.log('\n📋 Collections créées:');
    console.log('✅ Stores (magasins)');
    console.log('✅ Users (utilisateurs)');
    console.log('✅ Clients');
    console.log('✅ Products (produits)');
    console.log('✅ Sales (ventes)');
    console.log('✅ Sale Items (articles de vente)');
    console.log('✅ Reservations (réservations)');
    console.log('✅ Reservation Items (articles de réservation)');
    console.log('✅ Access Codes (codes d\'accès)');
    console.log('✅ Loyalty History (historique fidélité)');
    
    console.log('\n📋 Étapes suivantes recommandées:');
    console.log('1. Vérifiez les collections dans la console Appwrite');
    console.log('2. Importez les données de base si nécessaire');
    console.log('3. Testez l\'application avec la nouvelle structure');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la création des collections:', error);
    console.error('Détails:', error.message);
    process.exit(1);
  }
}

// Fonction pour créer la collection Stores
async function createStoresCollection() {
  try {
    console.log('📦 Création de la collection Stores...');
    
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.STORES);
      console.log('⚠️  Collection Stores existe déjà, suppression...');
      await databases.deleteCollection(DATABASE_ID, COLLECTIONS.STORES);
    } catch (error) {
      if (error.code !== 404) console.warn(`Avertissement: ${error.message}`);
    }
    
    const collection = await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.STORES,
      'Magasins',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Ajouter les attributs
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.STORES, 'name', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.STORES, 'address', 1000, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.STORES, 'phone', 20, true);
    await databases.createBooleanAttribute(DATABASE_ID, COLLECTIONS.STORES, 'isActive', true);
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.STORES, 'brand', ['sodiluxe', 'sillage', 'autre'], false);

    // Créer les index
    await databases.createIndex(DATABASE_ID, COLLECTIONS.STORES, 'name_index', 'key', ['name']);

    console.log('✅ Collection Stores créée');
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la collection Stores:`, error.message);
    throw error;
  }
}

// Fonction pour créer la collection Users
async function createUsersCollection() {
  try {
    console.log('👥 Création de la collection Users...');
    
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.USERS);
      console.log('⚠️  Collection Users existe déjà, suppression...');
      await databases.deleteCollection(DATABASE_ID, COLLECTIONS.USERS);
    } catch (error) {
      if (error.code !== 404) console.warn(`Avertissement: ${error.message}`);
    }
    
    const collection = await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.USERS,
      'Utilisateurs',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Ajouter les attributs
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'email', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'fullName', 255, true);
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.USERS, 'role', ['admin', 'manager', 'seller'], true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'storeId', 36, true);

    // Créer les index
    await databases.createIndex(DATABASE_ID, COLLECTIONS.USERS, 'email_index', 'unique', ['email']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.USERS, 'store_index', 'key', ['storeId']);

    console.log('✅ Collection Users créée');
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la collection Users:`, error.message);
    throw error;
  }
}

// Fonction pour créer la collection Clients
async function createClientsCollection() {
  try {
    console.log('👤 Création de la collection Clients...');
    
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.CLIENTS);
      console.log('⚠️  Collection Clients existe déjà, suppression...');
      await databases.deleteCollection(DATABASE_ID, COLLECTIONS.CLIENTS);
    } catch (error) {
      if (error.code !== 404) console.warn(`Avertissement: ${error.message}`);
    }
    
    const collection = await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.CLIENTS,
      'Clients',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Ajouter les attributs
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.CLIENTS, 'email', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.CLIENTS, 'fullName', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.CLIENTS, 'phone', 20, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.CLIENTS, 'address', 1000, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.CLIENTS, 'birthDate', 20, false);
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.CLIENTS, 'gender', ['homme', 'femme', 'entreprise'], true);
    await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.CLIENTS, 'loyaltyPoints', true, 0);
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.CLIENTS, 'loyaltyStatus', ['bronze', 'argent', 'or'], true, 'bronze');
    await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.CLIENTS, 'totalSpent', true, 0);

    // Créer les index
    await databases.createIndex(DATABASE_ID, COLLECTIONS.CLIENTS, 'email_index', 'unique', ['email']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.CLIENTS, 'fullName_index', 'fulltext', ['fullName']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.CLIENTS, 'phone_index', 'key', ['phone']);

    console.log('✅ Collection Clients créée');
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la collection Clients:`, error.message);
    throw error;
  }
}

// Fonction pour créer la collection Products
async function createProductsCollection() {
  try {
    console.log('🛍️  Création de la collection Products...');
    
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.PRODUCTS);
      console.log('⚠️  Collection Products existe déjà, suppression...');
      await databases.deleteCollection(DATABASE_ID, COLLECTIONS.PRODUCTS);
    } catch (error) {
      if (error.code !== 404) console.warn(`Avertissement: ${error.message}`);
    }
    
    const collection = await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      'Produits',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Ajouter les attributs
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PRODUCTS, 'name', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PRODUCTS, 'description', 2000, false);
    await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.PRODUCTS, 'price', true, 0);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PRODUCTS, 'category', 100, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PRODUCTS, 'brand', 100, true);
    await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.PRODUCTS, 'stockQuantity', true, 0);

    // Créer les index
    await databases.createIndex(DATABASE_ID, COLLECTIONS.PRODUCTS, 'name_index', 'fulltext', ['name']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.PRODUCTS, 'category_index', 'key', ['category']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.PRODUCTS, 'brand_index', 'key', ['brand']);

    console.log('✅ Collection Products créée');
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la collection Products:`, error.message);
    throw error;
  }
}

// Fonction pour créer la collection Sales
async function createSalesCollection() {
  try {
    console.log('💰 Création de la collection Sales...');
    
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.SALES);
      console.log('⚠️  Collection Sales existe déjà, suppression...');
      await databases.deleteCollection(DATABASE_ID, COLLECTIONS.SALES);
    } catch (error) {
      if (error.code !== 404) console.warn(`Avertissement: ${error.message}`);
    }
    
    const collection = await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.SALES,
      'Ventes',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Ajouter les attributs
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SALES, 'clientId', 36, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SALES, 'storeId', 36, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SALES, 'userId', 36, true);
    await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.SALES, 'totalAmount', true, 0);
    await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.SALES, 'discountAmount', true, 0);
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.SALES, 'paymentMethod', ['cash', 'card', 'transfer'], true);
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.SALES, 'status', ['pending', 'completed', 'cancelled'], true);

    // Créer les index
    await databases.createIndex(DATABASE_ID, COLLECTIONS.SALES, 'client_index', 'key', ['clientId']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.SALES, 'store_index', 'key', ['storeId']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.SALES, 'user_index', 'key', ['userId']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.SALES, 'date_index', 'key', ['$createdAt']);

    console.log('✅ Collection Sales créée');
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la collection Sales:`, error.message);
    throw error;
  }
}

// Fonction pour créer la collection SaleItems
async function createSaleItemsCollection() {
  try {
    console.log('📋 Création de la collection SaleItems...');
    
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.SALE_ITEMS);
      console.log('⚠️  Collection SaleItems existe déjà, suppression...');
      await databases.deleteCollection(DATABASE_ID, COLLECTIONS.SALE_ITEMS);
    } catch (error) {
      if (error.code !== 404) console.warn(`Avertissement: ${error.message}`);
    }
    
    const collection = await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.SALE_ITEMS,
      'Articles de vente',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Ajouter les attributs
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SALE_ITEMS, 'saleId', 36, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SALE_ITEMS, 'productId', 36, true);
    await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.SALE_ITEMS, 'quantity', true, 1);
    await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.SALE_ITEMS, 'unitPrice', true, 0);
    await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.SALE_ITEMS, 'discountAmount', true, 0);

    // Créer les index
    await databases.createIndex(DATABASE_ID, COLLECTIONS.SALE_ITEMS, 'sale_index', 'key', ['saleId']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.SALE_ITEMS, 'product_index', 'key', ['productId']);

    console.log('✅ Collection SaleItems créée');
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la collection SaleItems:`, error.message);
    throw error;
  }
}

// Fonction pour créer la collection Reservations
async function createReservationsCollection() {
  try {
    console.log('📅 Création de la collection Reservations...');
    
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.RESERVATIONS);
      console.log('⚠️  Collection Reservations existe déjà, suppression...');
      await databases.deleteCollection(DATABASE_ID, COLLECTIONS.RESERVATIONS);
    } catch (error) {
      if (error.code !== 404) console.warn(`Avertissement: ${error.message}`);
    }
    
    const collection = await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.RESERVATIONS,
      'Réservations',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Ajouter les attributs
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'clientId', 36, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'storeId', 36, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'createdBy', 36, true);
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'status', ['active', 'confirmed', 'completed', 'cancelled', 'expired'], true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'expectedPickupDate', 20, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'notes', 1000, false);
    await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'totalAmount', true, 0);

    // Créer les index
    await databases.createIndex(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'client_index', 'key', ['clientId']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'store_index', 'key', ['storeId']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'status_index', 'key', ['status']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'date_index', 'key', ['expectedPickupDate']);

    console.log('✅ Collection Reservations créée');
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la collection Reservations:`, error.message);
    throw error;
  }
}

// Fonction pour créer la collection ReservationItems
async function createReservationItemsCollection() {
  try {
    console.log('📝 Création de la collection ReservationItems...');
    
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.RESERVATION_ITEMS);
      console.log('⚠️  Collection ReservationItems existe déjà, suppression...');
      await databases.deleteCollection(DATABASE_ID, COLLECTIONS.RESERVATION_ITEMS);
    } catch (error) {
      if (error.code !== 404) console.warn(`Avertissement: ${error.message}`);
    }
    
    const collection = await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.RESERVATION_ITEMS,
      'Articles de réservation',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Ajouter les attributs
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.RESERVATION_ITEMS, 'reservationId', 36, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.RESERVATION_ITEMS, 'productId', 36, true);
    await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.RESERVATION_ITEMS, 'quantity', true, 1);
    await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.RESERVATION_ITEMS, 'unitPrice', true, 0);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.RESERVATION_ITEMS, 'notes', 500, false);

    // Créer les index
    await databases.createIndex(DATABASE_ID, COLLECTIONS.RESERVATION_ITEMS, 'reservation_index', 'key', ['reservationId']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.RESERVATION_ITEMS, 'product_index', 'key', ['productId']);

    console.log('✅ Collection ReservationItems créée');
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la collection ReservationItems:`, error.message);
    throw error;
  }
}

// Fonction pour créer la collection Access Codes
async function createAccessCodesCollection() {
  try {
    console.log('🔑 Création de la collection AccessCodes...');
    
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.ACCESS_CODES);
      console.log('⚠️  Collection AccessCodes existe déjà, suppression...');
      await databases.deleteCollection(DATABASE_ID, COLLECTIONS.ACCESS_CODES);
    } catch (error) {
      if (error.code !== 404) console.warn(`Avertissement: ${error.message}`);
    }
    
    const collection = await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.ACCESS_CODES,
      'Codes d\'accès',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Ajouter les attributs
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.ACCESS_CODES, 'code', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.ACCESS_CODES, 'description', 255, false);

    // Créer les index
    await databases.createIndex(DATABASE_ID, COLLECTIONS.ACCESS_CODES, 'code_index', 'unique', ['code']);

    console.log('✅ Collection AccessCodes créée');
    
    // Ajouter le code d'accès initial
    const accessCode = Buffer.from('sodiluxe').toString('hex');
    
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.ACCESS_CODES,
      ID.unique(),
      {
        code: accessCode,
        description: 'Code d\'accès pour la création de compte'
      }
    );
    
    console.log(`🔑 Code d'accès initial créé: ${accessCode}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la collection AccessCodes:`, error.message);
    throw error;
  }
}

// Fonction pour créer la collection Loyalty History
async function createLoyaltyHistoryCollection() {
  try {
    console.log('🏆 Création de la collection LoyaltyHistory...');
    
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.LOYALTY_HISTORY);
      console.log('⚠️  Collection LoyaltyHistory existe déjà, suppression...');
      await databases.deleteCollection(DATABASE_ID, COLLECTIONS.LOYALTY_HISTORY);
    } catch (error) {
      if (error.code !== 404) console.warn(`Avertissement: ${error.message}`);
    }
    
    await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.LOYALTY_HISTORY,
      'Historique Fidélité',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Attributs de la collection
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.LOYALTY_HISTORY, 'clientId', 36, true);
    await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.LOYALTY_HISTORY, 'pointsAdded', true, 0);
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.LOYALTY_HISTORY, 'source', ['purchase', 'bonus', 'adjustment'], true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.LOYALTY_HISTORY, 'saleId', 36, false);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.LOYALTY_HISTORY, 'description', 1000, false);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.LOYALTY_HISTORY, 'date', 30, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.LOYALTY_HISTORY, 'storeId', 36, false);

    // Index
    await databases.createIndex(DATABASE_ID, COLLECTIONS.LOYALTY_HISTORY, 'client_index', 'key', ['clientId']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.LOYALTY_HISTORY, 'sale_index', 'key', ['saleId']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.LOYALTY_HISTORY, 'date_index', 'key', ['date']);

    console.log('✅ Collection LoyaltyHistory créée');
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la collection LoyaltyHistory:`, error.message);
    throw error;
  }
}

// Exécuter la fonction principale
createCollections();
