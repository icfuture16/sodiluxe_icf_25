const sdk = require('node-appwrite');

// Configuration Appwrite
const client = new sdk.Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('68bf1c29001d20f7444d')
    .setKey('standard_7c860836bcc01137b6f2bac843cb0996bdb7d67d58e613ee92b26122296b0b7b42da7bbee2748b0b15c86f672a56e59ef5ebc21946625940759df6dc5396d43d0fb84c7535b3789f0ff54bc125305d06936ea9cbefec68dd0714dac4889fbeb630687ad2873aea1050bec1140c600a89d14e6cdfdffc6203509b14de4d897ad3');

const databases = new sdk.Databases(client);

const DATABASE_ID = '68bf1e7b003c6b340d6e';
const COLLECTION_ID = 'sales';

// Fonction pour récupérer les attributs d'une collection
async function getCollection() {
    try {
        const collection = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
        return collection;
    } catch (err) {
        console.error('❌ Erreur lors de la récupération de la collection:', err.message);
        return null;
    }
}

// Fonction pour supprimer un attribut
async function deleteAttribute(attributeKey) {
    try {
        await databases.deleteAttribute(DATABASE_ID, COLLECTION_ID, attributeKey);
        console.log(`✅ Attribut "${attributeKey}" supprimé avec succès`);
        return true;
    } catch (err) {
        console.error(`❌ Erreur lors de la suppression de l'attribut "${attributeKey}":`, err.message);
        return false;
    }
}

// Fonction pour créer un attribut enum
async function createEnumAttribute(name, elements, required = false, defaultValue = null) {
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
        console.error(`❌ Erreur lors de la création de l'attribut enum "${name}":`, err.message);
        return false;
    }
}

// Fonction pour créer un attribut texte standard (si l'enum ne fonctionne pas)
async function createStringAttribute(name, required = false, defaultValue = null, size = 255) {
    try {
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            name,
            size,
            required,
            defaultValue
        );
        console.log(`✅ Attribut texte "${name}" créé avec succès`);
        return true;
    } catch (err) {
        console.error(`❌ Erreur lors de la création de l'attribut texte "${name}":`, err.message);
        return false;
    }
}

// Exécution principale
(async () => {
    console.log('🔄 Mise à jour de l\'attribut paymentMethod pour correspondre aux valeurs du code...');

    // 1. Récupérer les informations sur la collection
    const collection = await getCollection();
    if (!collection) {
        console.log('❌ Impossible de continuer sans les informations de la collection');
        return;
    }

    // 2. Trouver l'attribut paymentMethod
    const paymentMethodAttr = collection.attributes.find(attr => attr.key === 'paymentMethod');
    if (paymentMethodAttr) {
        console.log(`ℹ️ Attribut paymentMethod trouvé avec le type: ${paymentMethodAttr.type}`);
        console.log(`ℹ️ Valeurs actuelles: ${paymentMethodAttr.elements ? paymentMethodAttr.elements.join(', ') : 'N/A'}`);
        
        // 3. Supprimer l'attribut existant
        console.log('🔄 Suppression de l\'attribut paymentMethod existant...');
        const deleted = await deleteAttribute('paymentMethod');
        if (!deleted) {
            console.log('❌ Échec de la mise à jour, impossible de supprimer l\'attribut existant');
            return;
        }
        
        // Attendre un peu pour s'assurer que la suppression est bien prise en compte
        console.log('⏳ Attente de la prise en compte de la suppression...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
        console.log('ℹ️ Attribut paymentMethod non trouvé, création d\'un nouvel attribut');
    }

    // 4. Créer un nouvel attribut avec les valeurs utilisées dans le code
    console.log('🔄 Création du nouvel attribut paymentMethod avec les valeurs du code...');
    
    // Liste des méthodes de paiement utilisées dans le code TypeScript
    const paymentMethods = ['especes', 'carte', 'wave', 'orange_money', 'cheque', 'cheque_cadeau', 'virement'];
    
    // Essayer de créer un attribut enum
    let success = await createEnumAttribute('paymentMethod', paymentMethods, false);
    
    // Si l'enum échoue, essayer avec un attribut texte standard
    if (!success) {
        console.log('⚠️ Échec de la création de l\'enum, tentative avec un attribut texte standard...');
        success = await createStringAttribute('paymentMethod', false, null, 50);
    }

    if (success) {
        console.log('✅ Mise à jour de paymentMethod terminée avec succès');
        console.log('🎉 La collection sales est maintenant prête à être utilisée avec les méthodes de paiement du code');
    } else {
        console.log('❌ Échec de la mise à jour de paymentMethod');
    }
})();

