const { Client, Databases, ID, Permission, Role } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Vérification des variables d'environnement requises
if (!process.env.APPWRITE_ENDPOINT || !process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
  console.error('Erreur: Variables d\'environnement manquantes.');
  console.error('Veuillez définir APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID et APPWRITE_API_KEY dans le fichier .env');
  process.exit(1);
}

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY); // Clé API avec permissions suffisantes

const databases = new Databases(client);

// ID de la base de données et collections importés depuis appwrite-config.js

// Fonction principale
async function createCollections() {
  try {
    console.log('Création des collections Appwrite...');
    console.log(`Utilisation de la base de données: ${DATABASE_ID}`);
    
    // Vérifier si la base de données existe, sinon la créer
    try {
      await databases.get(DATABASE_ID);
      console.log(`Base de données '${DATABASE_ID}' existe déjà.`);
    } catch (error) {
      if (error.code === 404) {
        await databases.create(DATABASE_ID, 'crm-sodiluxe', 'Base de données CRM Sodiluxe');
        console.log(`Base de données '${DATABASE_ID}' créée avec succès.`);
      } else {
        throw error;
      }
    }

    // Création des collections
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

    console.log('Toutes les collections ont été créées avec succès!');
  } catch (error) {
    console.error('Erreur lors de la création des collections:', error);
  }
}

// Fonction pour créer la collection Stores
async function createStoresCollection() {
  try {
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.STORES);
      console.log(`Collection '${COLLECTIONS.STORES}' existe déjà.`);
      return;
    } catch (error) {
      if (error.code !== 404) throw error;
    }

    // Créer la collection
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

    console.log(`Collection '${COLLECTIONS.STORES}' créée avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de la création de la collection '${COLLECTIONS.STORES}':`, error);
    throw error;
  }
}

// Fonction pour créer la collection Users
async function createUsersCollection() {
  try {
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.USERS);
      console.log(`Collection '${COLLECTIONS.USERS}' existe déjà.`);
      return;
    } catch (error) {
      if (error.code !== 404) throw error;
    }

    // Créer la collection
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

    console.log(`Collection '${COLLECTIONS.USERS}' créée avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de la création de la collection '${COLLECTIONS.USERS}':`, error);
    throw error;
  }
}

// Fonction pour créer la collection Clients
async function createClientsCollection() {
  try {
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.CLIENTS);
      console.log(`Collection '${COLLECTIONS.CLIENTS}' existe déjà.`);
      return;
    } catch (error) {
      if (error.code !== 404) throw error;
    }

    // Créer la collection
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

    console.log(`Collection '${COLLECTIONS.CLIENTS}' créée avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de la création de la collection '${COLLECTIONS.CLIENTS}':`, error);
    throw error;
  }
}

// Fonction pour créer la collection Products
async function createProductsCollection() {
  try {
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.PRODUCTS);
      console.log(`Collection '${COLLECTIONS.PRODUCTS}' existe déjà.`);
      return;
    } catch (error) {
      if (error.code !== 404) throw error;
    }

    // Créer la collection
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

    console.log(`Collection '${COLLECTIONS.PRODUCTS}' créée avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de la création de la collection '${COLLECTIONS.PRODUCTS}':`, error);
    throw error;
  }
}

// Fonction pour créer la collection Sales
async function createSalesCollection() {
  try {
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.SALES);
      console.log(`Collection '${COLLECTIONS.SALES}' existe déjà.`);
      return;
    } catch (error) {
      if (error.code !== 404) throw error;
    }

    // Créer la collection
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

    console.log(`Collection '${COLLECTIONS.SALES}' créée avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de la création de la collection '${COLLECTIONS.SALES}':`, error);
    throw error;
  }
}

// Fonction pour créer la collection SaleItems
async function createSaleItemsCollection() {
  try {
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.SALE_ITEMS);
      console.log(`Collection '${COLLECTIONS.SALE_ITEMS}' existe déjà.`);
      return;
    } catch (error) {
      if (error.code !== 404) throw error;
    }

    // Créer la collection
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

    console.log(`Collection '${COLLECTIONS.SALE_ITEMS}' créée avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de la création de la collection '${COLLECTIONS.SALE_ITEMS}':`, error);
    throw error;
  }
}

// Fonction pour créer la collection Access Codes
async function createAccessCodesCollection() {
  try {
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.ACCESS_CODES);
      console.log(`Collection '${COLLECTIONS.ACCESS_CODES}' existe déjà.`);
      return;
    } catch (error) {
      if (error.code !== 404) throw error;
    }

    // Créer la collection
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

    console.log(`Collection '${COLLECTIONS.ACCESS_CODES}' créée avec succès.`);
    
    // Ajouter le code d'accès initial
    // Convertir "sodiluxe" en code hexadécimal
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
    
    console.log(`Code d'accès initial créé: ${accessCode}`);
  } catch (error) {
    console.error(`Erreur lors de la création de la collection '${COLLECTIONS.ACCESS_CODES}':`, error);
    throw error;
  }
}

// Fonction pour créer la collection Reservations
async function createReservationsCollection() {
  try {
    // Vérifier si la collection existe déjà et la supprimer
    try {
      const existingCollection = await databases.getCollection(DATABASE_ID, COLLECTIONS.RESERVATIONS);
      console.log(`Collection '${COLLECTIONS.RESERVATIONS}' existe déjà. Suppression pour recréation...`);
      await databases.deleteCollection(DATABASE_ID, COLLECTIONS.RESERVATIONS);
      console.log(`Collection '${COLLECTIONS.RESERVATIONS}' supprimée avec succès.`);
    } catch (error) {
      if (error.code !== 404) console.warn(`Erreur lors de la vérification/suppression de la collection: ${error.message}`);
    }

    // Créer la collection
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
    await databases.createIndex(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'client_fulltext_index', 'fulltext', ['clientId']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'store_index', 'key', ['storeId']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'status_index', 'key', ['status']);
    await databases.createIndex(DATABASE_ID, COLLECTIONS.RESERVATIONS, 'date_index', 'key', ['expectedPickupDate']);

    console.log(`Collection '${COLLECTIONS.RESERVATIONS}' créée avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de la création de la collection '${COLLECTIONS.RESERVATIONS}':`, error);
    throw error;
  }
}

// Fonction pour créer la collection ReservationItems
async function createReservationItemsCollection() {
  try {
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.RESERVATION_ITEMS);
      console.log(`Collection '${COLLECTIONS.RESERVATION_ITEMS}' existe déjà.`);
      return;
    } catch (error) {
      if (error.code !== 404) throw error;
    }

    // Créer la collection
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

    console.log(`Collection '${COLLECTIONS.RESERVATION_ITEMS}' créée avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de la création de la collection '${COLLECTIONS.RESERVATION_ITEMS}':`, error);
    throw error;
  }
}

// Fonction pour créer la collection Loyalty History
async function createLoyaltyHistoryCollection() {
  try {
    // Vérifier si la collection existe déjà
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.LOYALTY_HISTORY);
      console.log(`Collection '${COLLECTIONS.LOYALTY_HISTORY}' existe déjà.`);
      return;
    } catch (error) {
      if (error.code !== 404) throw error;
    }

    // Créer la collection
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

    console.log(`Collection '${COLLECTIONS.LOYALTY_HISTORY}' créée avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de la création de la collection '${COLLECTIONS.LOYALTY_HISTORY}':`, error);
    throw error;
  }
}

// Exécuter la fonction principale
createCollections();