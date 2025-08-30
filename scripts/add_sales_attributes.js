const sdk = require('node-appwrite');

// Configuration Appwrite
const client = new sdk.Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('6856f8aa00281cb47665')
    .setKey('standard_4c24e91366984ffd2c2c09a0ed2d3527382fde636b7ea60c867a10467fb58ec942be378668988ad3cdc4993bf2f6839e75a7467b0771f3c8e899d0f1b3b063946c7ef195972d58310ccbbf899423fdd94ceda4b1e3a88c8c691d716e105890966f552b942cdf76360ae311305dae2559d92afe1ab64367f927af580263d63dc2');

const databases = new sdk.Databases(client);

const DATABASE_ID = '68599714002eef233c16';
const COLLECTION_ID = 'sales'; // Collection des ventes

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

// Fonction pour ajouter un attribut tableau
async function ensureArrayAttribute(name, required = false) {
    try {
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            name,
            255,
            required,
            null,
            true // isArray
        );
        console.log(`✅ Attribut "${name}" (tableau) ajouté avec succès`);
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

// Exécution principale
(async () => {
    console.log('🔄 Démarrage de la mise à jour du schéma de la collection sales...');
    
    // Ajout de l'attribut paymentSplits (qui manque selon l'erreur)
    // Nous le créons comme un tableau car le nom suggère qu'il s'agit d'une liste de paiements
    await ensureArrayAttribute('paymentSplits', false);
    
    // Autres attributs potentiellement nécessaires pour une vente
    // Ces attributs sont communs dans un système de vente, à ajuster selon votre modèle exact
    const attributes = [
        { name: 'customerId', type: 'string', required: false },
        { name: 'storeId', type: 'string', required: false },
        { name: 'totalAmount', type: 'float', required: false },
        { name: 'status', type: 'string', required: false },
        { name: 'date', type: 'string', required: false }, // format date ISO
        { name: 'items', type: 'array', required: false }, // produits vendus
        { name: 'paymentMethod', type: 'string', required: false },
        { name: 'notes', type: 'string', required: false, size: 1000 }
    ];

    // Ajout des attributs
    for (const attr of attributes) {
        if (attr.type === 'string') {
            await ensureStringAttribute(attr.name, attr.required, attr.defaultValue, attr.size || 255);
        } else if (attr.type === 'integer') {
            await ensureIntegerAttribute(attr.name, attr.required, attr.defaultValue);
        } else if (attr.type === 'float') {
            await ensureFloatAttribute(attr.name, attr.required, attr.defaultValue);
        } else if (attr.type === 'array') {
            await ensureArrayAttribute(attr.name, attr.required);
        }
    }

    console.log('✅ Mise à jour du schéma terminée');
    console.log('🎉 La collection sales est maintenant prête à être utilisée');
})();
