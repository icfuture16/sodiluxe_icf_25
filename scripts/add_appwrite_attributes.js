const sdk = require('node-appwrite');

// Configuration Appwrite
const client = new sdk.Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('68bf1c29001d20f7444d')
    .setKey('standard_7c860836bcc01137b6f2bac843cb0996bdb7d67d58e613ee92b26122296b0b7b42da7bbee2748b0b15c86f672a56e59ef5ebc21946625940759df6dc5396d43d0fb84c7535b3789f0ff54bc125305d06936ea9cbefec68dd0714dac4889fbeb630687ad2873aea1050bec1140c600a89d14e6cdfdffc6203509b14de4d897ad3');

const databases = new sdk.Databases(client);

const DATABASE_ID = '68bf1e7b003c6b340d6e';
const COLLECTION_ID = 'products'; // ID de la collection produits

// Fonction pour ajouter un attribut texte
async function ensureStringAttribute(name, required = false, defaultValue = null, size = 255) {
    try {
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            name,
            size,
            required,
            defaultValue
        );
        console.log(`✅ Attribut "${name}" (texte) ajouté avec succès`);
        return true;
    } catch (err) {
        if (err.message && err.message.includes('already exists')) {
            console.log(`ℹ️ Attribut "${name}" déjà présent`);
            return true;
        } else {
            console.error(`❌ Erreur pour "${name}":`, err.message);
            return false;
        }
    }
}

// Fonction pour ajouter un attribut nombre entier
async function ensureIntegerAttribute(name, required = false, defaultValue = null, min = null, max = null) {
    try {
        await databases.createIntegerAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            name,
            required,
            defaultValue,
            min,
            max
        );
        console.log(`✅ Attribut "${name}" (entier) ajouté avec succès`);
        return true;
    } catch (err) {
        if (err.message && err.message.includes('already exists')) {
            console.log(`ℹ️ Attribut "${name}" déjà présent`);
            return true;
        } else {
            console.error(`❌ Erreur pour "${name}":`, err.message);
            return false;
        }
    }
}

// Fonction pour ajouter un attribut nombre décimal
async function ensureFloatAttribute(name, required = false, defaultValue = null, min = null, max = null) {
    try {
        await databases.createFloatAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            name,
            required,
            defaultValue,
            min,
            max
        );
        console.log(`✅ Attribut "${name}" (décimal) ajouté avec succès`);
        return true;
    } catch (err) {
        if (err.message && err.message.includes('already exists')) {
            console.log(`ℹ️ Attribut "${name}" déjà présent`);
            return true;
        } else {
            console.error(`❌ Erreur pour "${name}":`, err.message);
            return false;
        }
    }
}

// Fonction pour créer un index
async function createIndex(name, attributes, type = 'key') {
    try {
        await databases.createIndex(
            DATABASE_ID,
            COLLECTION_ID,
            name,
            type,
            attributes
        );
        console.log(`✅ Index "${name}" créé avec succès`);
        return true;
    } catch (err) {
        if (err.message && err.message.includes('already exists')) {
            console.log(`ℹ️ Index "${name}" déjà présent`);
            return true;
        } else {
            console.error(`❌ Erreur pour l'index "${name}":`, err.message);
            return false;
        }
    }
}

// Exécution principale
(async () => {
    console.log('🔄 Démarrage de la mise à jour du schéma Appwrite...');
    
    // Définition des attributs à ajouter
    const attributes = [
        { name: 'name', type: 'string', required: true, defaultValue: null, size: 255 },
        { name: 'description', type: 'string', required: false, defaultValue: null, size: 1000 },
        { name: 'price', type: 'float', required: true, defaultValue: 0 },
        { name: 'category', type: 'string', required: true, defaultValue: null },
        { name: 'subcategory', type: 'string', required: false, defaultValue: null },
        { name: 'stockQuantity', type: 'integer', required: true, defaultValue: 0 },
        { name: 'lowStockThreshold', type: 'integer', required: false, defaultValue: 2 },
        { name: 'status', type: 'string', required: false, defaultValue: null },
        { name: 'reference', type: 'string', required: false, defaultValue: null }
    ];

    // Ajout des attributs
    let success = true;
    for (const attr of attributes) {
        let result = false;
        
        if (attr.type === 'string') {
            result = await ensureStringAttribute(attr.name, attr.required, attr.defaultValue, attr.size);
        } else if (attr.type === 'integer') {
            result = await ensureIntegerAttribute(attr.name, attr.required, attr.defaultValue);
        } else if (attr.type === 'float') {
            result = await ensureFloatAttribute(attr.name, attr.required, attr.defaultValue);
        }
        
        if (!result) {
            success = false;
        }
    }

    // Création d'index pour les champs de recherche courants
    const indexes = [
        { name: 'idx_name', attributes: ['name'] },
        { name: 'idx_category', attributes: ['category'] },
        { name: 'idx_status', attributes: ['status'] },
        { name: 'idx_reference', attributes: ['reference'] }
    ];

    for (const index of indexes) {
        await createIndex(index.name, index.attributes);
    }

    if (success) {
        console.log('✅ Tous les attributs ont été vérifiés et ajoutés si nécessaire');
        console.log('🎉 La collection products est maintenant prête à être utilisée');
    } else {
        console.log('⚠️ Certains attributs n\'ont pas pu être ajoutés, vérifiez les erreurs ci-dessus');
    }
})();

