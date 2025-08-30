import { Client, Databases, Account, Query, Teams } from 'appwrite'

if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
  throw new Error('Missing NEXT_PUBLIC_APPWRITE_ENDPOINT')
}

if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  throw new Error('Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID')
}

// Détecter l'environnement actuel (production vs développement)
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// Initialiser le client Appwrite avec la configuration appropriée
export const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)

// Injection sécurisée de la clé API côté serveur uniquement
if (typeof window === 'undefined' && process.env.APPWRITE_API_KEY) {
  // @ts-ignore: setKey n'est pas typé publiquement mais existe sur le client Appwrite
  client.setKey?.(process.env.APPWRITE_API_KEY);
}

// Configuration des en-têtes selon l'environnement
if (isProduction) {
  // En production, utiliser l'URL de production
  console.log('Environnement de production détecté');
  
  // Détecter automatiquement le domaine de production
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const currentOrigin = window.location.origin;
    
    // Liste des domaines de production valides
    const isNetlify = hostname.includes('netlify.app');
    const isCustomDomain = hostname === 'sodiluxecrm.com' || hostname.includes('.sodiluxecrm.com');
    
    // Si nous sommes sur un domaine de production valide
    if (isNetlify || isCustomDomain) {
      console.log('Configuration CORS avec origine:', currentOrigin);
      
      // Ajouter l'en-tête Origin dynamiquement basé sur l'URL actuelle
      client.headers['Origin'] = currentOrigin;
    }
  }
} else {
  // En développement (localhost), conserver le comportement actuel
  console.log('Environnement de développement détecté');
  
  if (process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME) {
    console.log('Configuration CORS avec origine:', process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME);
    client.headers['Origin'] = process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME;
  }
}

// Initialiser les services Appwrite
export const databases = new Databases(client)
export const account = new Account(client)
export const teams = new Teams(client)

// Database and Collection IDs
// Utiliser NEXT_PUBLIC_ pour les variables accessibles côté client
export const DATABASE_ID = '68599714002eef233c16'; // ID de la base de données 'crm_sodiluxe'
export const COLLECTIONS = {
  USERS: 'users',
  CLIENTS: 'clients',
  SALES: 'sales',
  SALE_ITEMS: 'sale_items',
  PRODUCTS: 'products',
  STORES: 'stores',
  RESERVATIONS: 'reservations',
  RESERVATION_ITEMS: 'reservation_items',
  INVENTORIES: 'inventories',
  STOCK_MOVEMENTS: 'stock_movements',
  STOCK_ALERTS: 'stock_alerts',
  INVENTORIES_MOVEMENTS: 'inventories_movements',
  INVENTORIES_ALERTS: 'inventories_alerts',
  PRODUCT_CATEGORIES: 'product_categories',
  CATEGORIES: 'categories',
  // Modules avancés
  AFTER_SALES_SERVICE: 'after_sales_service',
  // Ventes débitrices
  DEBIT_SALES: 'debit_sales',
  DEBIT_SALE_ITEMS: 'debit_sale_items',

  PAYMENT_HISTORY: 'payment_history',
  ACCESS_CODES: 'access_codes',
  OBJECTIVES: 'objectives',
  // Fidélité
  LOYALTY_HISTORY: 'loyalty_history'
} as const

// Export Query for convenience
export { Query }