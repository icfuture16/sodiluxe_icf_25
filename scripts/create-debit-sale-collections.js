const { Client, Databases, ID, Permission, Role } = require('node-appwrite');
require('dotenv').config();

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY); // Assurez-vous d'avoir une clé API avec les permissions appropriées

const databases = new Databases(client);

// ID de la base de données (à partir de client.ts)
const DATABASE_ID = '68599714002eef233c16';

// Fonction pour créer les collections nécessaires aux ventes débitrices
async function createDebitSaleCollections() {
    try {
        console.log('Création des collections pour les ventes débitrices...');

        // 1. Collection debit_sales
        console.log('Création de la collection debit_sales...');
        try {
            const debitSalesCollection = await databases.createCollection(
                DATABASE_ID,
                'debit_sales',
                'Ventes Débitrices',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );

            // Ajouter les attributs à la collection debit_sales
            await databases.createStringAttribute(DATABASE_ID, 'debit_sales', 'clientId', 36, true);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sales', 'storeId', 36, true);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sales', 'userId', 36, true);
            await databases.createNumberAttribute(DATABASE_ID, 'debit_sales', 'totalAmount', true);
            await databases.createNumberAttribute(DATABASE_ID, 'debit_sales', 'discountAmount', false, 0);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sales', 'status', 20, true);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sales', 'saleDate', 30, true);
            await databases.createNumberAttribute(DATABASE_ID, 'debit_sales', 'initialPayment', true);
            await databases.createNumberAttribute(DATABASE_ID, 'debit_sales', 'remainingAmount', true);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sales', 'guarantorName', 100, true);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sales', 'guarantorContact', 100, true);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sales', 'guarantorRelation', 50, true);
            await databases.createNumberAttribute(DATABASE_ID, 'debit_sales', 'numberOfInstallments', true);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sales', 'createdAt', 30, true);

            // Créer un index pour la recherche rapide
            await databases.createIndex(DATABASE_ID, 'debit_sales', 'client_index', 'key', ['clientId']);
            await databases.createIndex(DATABASE_ID, 'debit_sales', 'store_index', 'key', ['storeId']);
            await databases.createIndex(DATABASE_ID, 'debit_sales', 'status_index', 'key', ['status']);
            
            console.log('Collection debit_sales créée avec succès!');
        } catch (error) {
            if (error.code === 409) {
                console.log('La collection debit_sales existe déjà.');
            } else {
                throw error;
            }
        }

        // 2. Collection debit_sale_items
        console.log('Création de la collection debit_sale_items...');
        try {
            const debitSaleItemsCollection = await databases.createCollection(
                DATABASE_ID,
                'debit_sale_items',
                'Articles des Ventes Débitrices',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );

            // Ajouter les attributs à la collection debit_sale_items
            await databases.createStringAttribute(DATABASE_ID, 'debit_sale_items', 'debitSaleId', 36, true);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sale_items', 'productId', 36, true);
            await databases.createNumberAttribute(DATABASE_ID, 'debit_sale_items', 'quantity', true);
            await databases.createNumberAttribute(DATABASE_ID, 'debit_sale_items', 'unitPrice', true);
            await databases.createNumberAttribute(DATABASE_ID, 'debit_sale_items', 'totalPrice', true);
            await databases.createNumberAttribute(DATABASE_ID, 'debit_sale_items', 'discountAmount', false, 0);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sale_items', 'createdAt', 30, true);

            // Créer un index pour la recherche rapide
            await databases.createIndex(DATABASE_ID, 'debit_sale_items', 'debit_sale_index', 'key', ['debitSaleId']);
            
            console.log('Collection debit_sale_items créée avec succès!');
        } catch (error) {
            if (error.code === 409) {
                console.log('La collection debit_sale_items existe déjà.');
            } else {
                throw error;
            }
        }

        // 3. Collection debit_sale_installments
        console.log('Création de la collection debit_sale_installments...');
        try {
            const debitSaleInstallmentsCollection = await databases.createCollection(
                DATABASE_ID,
                'debit_sale_installments',
                'Échéances des Ventes Débitrices',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );

            // Ajouter les attributs à la collection debit_sale_installments
            await databases.createStringAttribute(DATABASE_ID, 'debit_sale_installments', 'debitSaleId', 36, true);
            await databases.createNumberAttribute(DATABASE_ID, 'debit_sale_installments', 'amount', true);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sale_installments', 'dueDate', 30, true);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sale_installments', 'status', 20, true);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sale_installments', 'paymentMethod', 30, false);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sale_installments', 'paymentDate', 30, false);
            await databases.createNumberAttribute(DATABASE_ID, 'debit_sale_installments', 'installmentNumber', true);
            await databases.createStringAttribute(DATABASE_ID, 'debit_sale_installments', 'createdAt', 30, true);

            // Créer un index pour la recherche rapide
            await databases.createIndex(DATABASE_ID, 'debit_sale_installments', 'debit_sale_index', 'key', ['debitSaleId']);
            await databases.createIndex(DATABASE_ID, 'debit_sale_installments', 'status_index', 'key', ['status']);
            
            console.log('Collection debit_sale_installments créée avec succès!');
        } catch (error) {
            if (error.code === 409) {
                console.log('La collection debit_sale_installments existe déjà.');
            } else {
                throw error;
            }
        }

        console.log('Toutes les collections pour les ventes débitrices ont été créées avec succès!');

    } catch (error) {
        console.error('Erreur lors de la création des collections:', error);
    }
}

// Exécuter la fonction
createDebitSaleCollections();
