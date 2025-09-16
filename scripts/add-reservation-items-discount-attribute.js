/**
 * Script pour ajouter l'attribut discountPercentage à la collection reservation_items
 * Inspiré de la structure de sale_items qui utilise discountAmount
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

// Configuration Appwrite
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = 'reservation_items';

/**
 * Fonction pour vérifier si un attribut existe dans une collection
 */
async function attributeExists(collectionId, attributeKey) {
    try {
        const collection = await databases.getCollection(DATABASE_ID, collectionId);
        return collection.attributes.some(attr => attr.key === attributeKey);
    } catch (error) {
        console.error(`Erreur lors de la vérification de l'attribut ${attributeKey}:`, error.message);
        return false;
    }
}

/**
 * Fonction pour ajouter l'attribut discountPercentage
 */
async function addDiscountPercentageAttribute() {
    try {
        console.log('🔍 Vérification de l\'existence de l\'attribut discountPercentage...');
        
        const exists = await attributeExists(COLLECTION_ID, 'discountPercentage');
        
        if (exists) {
            console.log('✅ L\'attribut discountPercentage existe déjà dans la collection reservation_items.');
            return;
        }
        
        console.log('➕ Ajout de l\'attribut discountPercentage à la collection reservation_items...');
        
        // Ajouter l'attribut discountPercentage comme float optionnel (inspiré de sale_items.discountAmount)
        await databases.createFloatAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'discountPercentage',
            false, // required = false (optionnel)
            0      // valeur par défaut
        );
        
        console.log('✅ Attribut discountPercentage ajouté avec succès à la collection reservation_items!');
        console.log('📋 Configuration: Float, optionnel, valeur par défaut = 0');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout de l\'attribut discountPercentage:', error.message);
        throw error;
    }
}

/**
 * Fonction principale
 */
async function main() {
    try {
        console.log('🚀 Démarrage du script d\'ajout de l\'attribut discountPercentage...');
        console.log(`📊 Base de données: ${DATABASE_ID}`);
        console.log(`📦 Collection: ${COLLECTION_ID}`);
        console.log('');
        
        await addDiscountPercentageAttribute();
        
        console.log('');
        console.log('🎉 Script terminé avec succès!');
        console.log('💡 La collection reservation_items est maintenant alignée avec l\'interface ReservationItemInput.');
        
    } catch (error) {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }
}

// Exécution du script
if (require.main === module) {
    main();
}

module.exports = { addDiscountPercentageAttribute };

