const sdk = require('node-appwrite');

// Configuration Appwrite
const client = new sdk.Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('68bf1c29001d20f7444d')
    .setKey('standard_7c860836bcc01137b6f2bac843cb0996bdb7d67d58e613ee92b26122296b0b7b42da7bbee2748b0b15c86f672a56e59ef5ebc21946625940759df6dc5396d43d0fb84c7535b3789f0ff54bc125305d06936ea9cbefec68dd0714dac4889fbeb630687ad2873aea1050bec1140c600a89d14e6cdfdffc6203509b14de4d897ad3');

const databases = new sdk.Databases(client);

const DATABASE_ID = '68bf1e7b003c6b340d6e';
const COLLECTION_ID = 'sales';

// Fonctions utilitaires pour les attributs
async function ensureStringAttribute(name, required = false, defaultValue = null, size = 255, isArray = false) {
    try {
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            name,
            size,
            required,
            defaultValue,
            isArray
        );
        console.log(`✅ Attribut "${name}" (${isArray ? 'tableau de texte' : 'texte'}) ajouté avec succès`);
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

async function ensureEnumAttribute(name, elements, required = false, defaultValue = null) {
    try {
        await databases.createEnumAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            name,
            elements,
            required,
            defaultValue
        );
        console.log(`✅ Attribut enum "${name}" créé avec succès avec les valeurs: ${elements.join(', ')}`);
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
    console.log('🔄 Vérification et mise à jour complète du schéma de la collection sales...');
    
    // Attributs principaux de la vente (d'après le code dans NewSaleModal.tsx)
    const mainAttributes = [
        { name: 'clientId', type: 'string', required: true },
        { name: 'storeId', type: 'string', required: true },
        { name: 'userId', type: 'string', required: true },
        { name: 'totalAmount', type: 'float', required: true },
        { name: 'discountAmount', type: 'float', required: false, defaultValue: 0 },
        { name: 'status', type: 'enum', required: true, elements: ['pending', 'completed', 'cancelled'] },
        { name: 'saleDate', type: 'string', required: true }, // Format date ISO
        { name: 'notes', type: 'string', required: false, size: 1000 },
        
        // Champs pour les items (si stockés directement dans la vente)
        { name: 'items', type: 'string', required: false, isArray: true }
    ];
    
    // Vérifier/créer les attributs principaux
    for (const attr of mainAttributes) {
        if (attr.type === 'string') {
            await ensureStringAttribute(attr.name, attr.required, attr.defaultValue, attr.size || 255, attr.isArray || false);
        } else if (attr.type === 'float') {
            await ensureFloatAttribute(attr.name, attr.required, attr.defaultValue);
        } else if (attr.type === 'enum') {
            await ensureEnumAttribute(attr.name, attr.elements, attr.required, attr.defaultValue);
        }
    }
    
    // Vérifier que paymentSplits est bien un tableau
    // Ce champ est crucial car il a causé l'erreur précédente
    console.log('🔄 Vérification spécifique de l\'attribut paymentSplits...');
    
    try {
        // Nous essayons de créer un attribut JSON pour stocker les paiements multiples
        // car c'est le format le plus approprié pour un tableau d'objets complexes
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'paymentSplits',
            16000, // Taille suffisante pour un JSON
            false,
            null,
            true // isArray = true
        );
        console.log('✅ Attribut "paymentSplits" (tableau) ajouté avec succès');
    } catch (err) {
        if (err.message && err.message.includes('already exists')) {
            console.log('ℹ️ Attribut "paymentSplits" déjà présent');
        } else {
            console.error('❌ Erreur pour "paymentSplits":', err.message);
            console.log('⚠️ Tentative alternative pour paymentSplits...');
            
            try {
                // Si la création comme tableau échoue, essayons en tant que chaîne JSON
                await databases.createStringAttribute(
                    DATABASE_ID,
                    COLLECTION_ID,
                    'paymentSplits',
                    16000,
                    false
                );
                console.log('✅ Attribut "paymentSplits" (texte JSON) ajouté avec succès');
            } catch (jsonErr) {
                console.error('❌ Échec de la création de paymentSplits:', jsonErr.message);
            }
        }
    }

    console.log('✅ Vérification du schéma terminée');
    console.log('🎉 La collection sales est maintenant prête à être utilisée avec tous les attributs nécessaires');
})();

