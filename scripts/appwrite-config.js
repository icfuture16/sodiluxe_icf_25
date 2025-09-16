// Configuration centralisée pour Appwrite
require('dotenv').config();

module.exports = {
  DATABASE_ID: process.env.APPWRITE_DATABASE_ID || '68bf1e7b003c6b340d6e',
  PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68bf1c29001d20f7444d',
  ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  COLLECTIONS: {
    STORES: 'stores',
    USERS: 'users',
    CLIENTS: 'clients',
    PRODUCTS: 'products',
    SALES: 'sales',
    SALE_ITEMS: 'sale_items',
    RESERVATIONS: 'reservations',
    RESERVATION_ITEMS: 'reservation_items',
    ACCESS_CODES: 'access_codes',
    STOCK: 'stock',
    STOCK_MOVEMENTS: 'stock_movements',
    INVENTORIES: 'inventories',
    STOCK_ALERTS: 'stock_alerts',
    CATEGORIES: 'categories',
    LOYALTY_HISTORY: 'loyalty_history'
  }
};

