/**
 * Script pour créer les collections nécessaires à la gestion de stock dans Appwrite
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Databases, ID, Permission, Role } = require('node-appwrite');
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

// Définition des collections à créer
const collections = [
  {
    id: 'stock',
    name: 'Stock',
    attributes: [
      { key: 'productId', type: 'string', required: true, array: false },
      { key: 'storeId', type: 'string', required: true, array: false },
      { key: 'quantity', type: 'integer', required: true, min: 0, default: 0 },
      { key: 'minThreshold', type: 'integer', required: true, min: 0, default: 5 },
      { key: 'maxThreshold', type: 'integer', required: false, min: 0 },
      { key: 'lastUpdated', type: 'datetime', required: true },
      { key: 'notes', type: 'string', required: false, size: 1000 }
    ],
    indexes: [
      { key: 'product_store_index', type: 'key', attributes: ['productId', 'storeId'], orders: ['ASC', 'ASC'] },
      { key: 'low_stock_index', type: 'key', attributes: ['quantity', 'minThreshold'], orders: ['ASC', 'ASC'] }
    ]
  },
  {
    id: 'stock_movements',
    name: 'Mouvements de Stock',
    attributes: [
      { key: 'productId', type: 'string', required: true, array: false },
      { key: 'storeId', type: 'string', required: true, array: false },
      { key: 'quantity', type: 'integer', required: true },
      { key: 'type', type: 'string', required: true, elements: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'] },
      { key: 'reason', type: 'string', required: false, size: 500 },
      { key: 'referenceId', type: 'string', required: false },
      { key: 'referenceType', type: 'string', required: false, elements: ['SALE', 'PURCHASE', 'RETURN', 'INVENTORY', 'OTHER'] },
      { key: 'userId', type: 'string', required: true },
      { key: 'timestamp', type: 'datetime', required: true },
      { key: 'destinationStoreId', type: 'string', required: false }
    ],
    indexes: [
      { key: 'product_store_index', type: 'key', attributes: ['productId', 'storeId'], orders: ['ASC', 'ASC'] },
      { key: 'timestamp_index', type: 'key', attributes: ['timestamp'], orders: ['DESC'] },
      { key: 'type_index', type: 'key', attributes: ['type'], orders: ['ASC'] }
    ]
  },
  {
    id: 'inventories',
    name: 'Inventaires',
    attributes: [
      { key: 'storeId', type: 'string', required: true, array: false },
      { key: 'userId', type: 'string', required: true, array: false },
      { key: 'status', type: 'string', required: true, elements: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
      { key: 'startDate', type: 'datetime', required: true },
      { key: 'endDate', type: 'datetime', required: false },
      { key: 'notes', type: 'string', required: false, size: 1000 },
      { key: 'items', type: 'string', required: false, array: true },
      { key: 'discrepancies', type: 'integer', required: false, default: 0 }
    ],
    indexes: [
      { key: 'store_index', type: 'key', attributes: ['storeId'], orders: ['ASC'] },
      { key: 'status_index', type: 'key', attributes: ['status'], orders: ['ASC'] },
      { key: 'date_index', type: 'key', attributes: ['startDate'], orders: ['DESC'] }
    ]
  },
  {
    id: 'stock_alerts',
    name: 'Alertes de Stock',
    attributes: [
      { key: 'productId', type: 'string', required: true, array: false },
      { key: 'storeId', type: 'string', required: true, array: false },
      { key: 'type', type: 'string', required: true, elements: ['LOW_STOCK', 'OVERSTOCK', 'EXPIRY', 'DISCREPANCY'] },
      { key: 'severity', type: 'string', required: true, elements: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      { key: 'message', type: 'string', required: true, size: 500 },
      { key: 'quantity', type: 'integer', required: false },
      { key: 'threshold', type: 'integer', required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'acknowledged', type: 'boolean', required: true, default: false },
      { key: 'acknowledgedBy', type: 'string', required: false },
      { key: 'acknowledgedAt', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'product_store_index', type: 'key', attributes: ['productId', 'storeId'], orders: ['ASC', 'ASC'] },
      { key: 'type_index', type: 'key', attributes: ['type'], orders: ['ASC'] },
      { key: 'severity_index', type: 'key', attributes: ['severity'], orders: ['DESC'] },
      { key: 'acknowledged_index', type: 'key', attributes: ['acknowledged'], orders: ['ASC'] },
      { key: 'created_index', type: 'key', attributes: ['createdAt'], orders: ['DESC'] }
    ]
  },
  {
    id: 'categories',
    name: 'Catégories',
    attributes: [
      { key: 'name', type: 'string', required: true, array: false, size: 100 },
      { key: 'description', type: 'string', required: false, size: 500 },
      { key: 'parentId', type: 'string', required: false },
      { key: 'color', type: 'string', required: false, size: 20 },
      { key: 'icon', type: 'string', required: false, size: 50 },
      { key: 'active', type: 'boolean', required: false, default: true }
    ],
    indexes: [
      { key: 'name_index', type: 'key', attributes: ['name'], orders: ['ASC'] },
      { key: 'parent_index', type: 'key', attributes: ['parentId'], orders: ['ASC'] },
      { key: 'active_index', type: 'key', attributes: ['active'], orders: ['DESC'] }
    ]
  }
];

// Fonction pour créer une collection
async function createCollection(collectionData) {
  try {
    console.log(`Vérification de la collection ${collectionData.name} (${collectionData.id})...`);
    
    try {
      // Vérifier si la collection existe déjà
      await databases.getCollection(DATABASE_ID, collectionData.id);
      console.log(`  ✓ La collection ${collectionData.name} existe déjà.`);
      return;
    } catch (error) {
      // Si la collection n'existe pas, la créer
      if (error.code === 404) {
        console.log(`  ✗ La collection ${collectionData.name} n'existe pas. Création en cours...`);
        
        // Créer la collection
        const collection = await databases.createCollection(
          DATABASE_ID,
          collectionData.id,
          collectionData.name,
          [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ]
        );
        
        console.log(`  ✓ Collection ${collectionData.name} créée avec succès.`);
        
        // Créer les attributs
        for (const attr of collectionData.attributes) {
          console.log(`    - Création de l'attribut ${attr.key}...`);
          
          try {
            if (attr.type === 'string' && attr.elements) {
              await databases.createEnumAttribute(
                DATABASE_ID,
                collection.$id,
                attr.key,
                attr.elements,
                attr.required,
                attr.default,
                attr.array
              );
            } else if (attr.type === 'string') {
              await databases.createStringAttribute(
                DATABASE_ID,
                collection.$id,
                attr.key,
                attr.size || 255,
                attr.required,
                attr.default,
                attr.array
              );
            } else if (attr.type === 'integer') {
              await databases.createIntegerAttribute(
                DATABASE_ID,
                collection.$id,
                attr.key,
                attr.required,
                attr.min,
                attr.max,
                attr.default,
                attr.array
              );
            } else if (attr.type === 'boolean') {
              await databases.createBooleanAttribute(
                DATABASE_ID,
                collection.$id,
                attr.key,
                attr.required,
                attr.default,
                attr.array
              );
            } else if (attr.type === 'datetime') {
              await databases.createDatetimeAttribute(
                DATABASE_ID,
                collection.$id,
                attr.key,
                attr.required,
                attr.default,
                attr.array
              );
            }
            
            console.log(`    ✓ Attribut ${attr.key} créé avec succès.`);
          } catch (attrError) {
            console.error(`    ✗ Erreur lors de la création de l'attribut ${attr.key}:`, attrError.message);
          }
        }
        
        // Créer les index
        if (collectionData.indexes) {
          for (const index of collectionData.indexes) {
            console.log(`    - Création de l'index ${index.key}...`);
            
            try {
              await databases.createIndex(
                DATABASE_ID,
                collection.$id,
                index.key,
                index.type,
                index.attributes,
                index.orders
              );
              
              console.log(`    ✓ Index ${index.key} créé avec succès.`);
            } catch (indexError) {
              console.error(`    ✗ Erreur lors de la création de l'index ${index.key}:`, indexError.message);
            }
          }
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error(`✗ Erreur lors de la création de la collection ${collectionData.name}:`, error.message);
  }
}

// Fonction principale pour créer toutes les collections
async function createAllCollections() {
  console.log('Création des collections pour la gestion de stock...');
  
  for (const collection of collections) {
    await createCollection(collection);
  }
  
  console.log('\nProcessus terminé!');
}

// Exécuter la fonction principale
createAllCollections().catch(error => {
  console.error('Erreur inattendue:', error);
  process.exit(1);
});