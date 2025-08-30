// Configuration centralisée pour Appwrite
require('dotenv').config();

module.exports = {
  DATABASE_ID: process.env.APPWRITE_DATABASE_ID || '68599714002eef233c16',
  PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6856f8aa00281cb47665',
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