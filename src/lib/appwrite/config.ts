// Configuration Appwrite - Constantes partagées
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

// Mot de passe développeur pour les opérations sensibles
export const DEVELOPER_PASSWORD = 'dev2024!'