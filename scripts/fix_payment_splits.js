const sdk = require('node-appwrite');

// Configuration Appwrite
const client = new sdk.Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('6856f8aa00281cb47665')
    .setKey('standard_4c24e91366984ffd2c2c09a0ed2d3527382fde636b7ea60c867a10467fb58ec942be378668988ad3cdc4993bf2f6839e75a7467b0771f3c8e899d0f1b3b063946c7ef195972d58310ccbbf899423fdd94ceda4b1e3a88c8c691d716e105890966f552b942cdf76360ae311305dae2559d92afe1ab64367f927af580263d63dc2');

const databases = new sdk.Databases(client);

const DATABASE_ID = '68599714002eef233c16';
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

// Fonction pour créer un attribut texte standard
async function createStringAttribute(name, required = false, defaultValue = null, size = 255, isArray = false) {
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
        console.error(`❌ Erreur lors de la création de l'attribut "${name}":`, err.message);
        return false;
    }
}

// Exécution principale
(async () => {
    console.log('🔄 Mise à jour de l\'attribut paymentSplits...');

    // 1. Récupérer les informations sur la collection
    const collection = await getCollection();
    if (!collection) {
        console.log('❌ Impossible de continuer sans les informations de la collection');
        return;
    }

    // 2. Trouver l'attribut paymentSplits
    const paymentSplitsAttr = collection.attributes.find(attr => attr.key === 'paymentSplits');
    if (paymentSplitsAttr) {
        console.log(`ℹ️ Attribut paymentSplits trouvé avec le type: ${paymentSplitsAttr.type}`);
        console.log(`ℹ️ Est un tableau: ${paymentSplitsAttr.array ? 'Oui' : 'Non'}`);
        
        // 3. Supprimer l'attribut existant
        console.log('🔄 Suppression de l\'attribut paymentSplits existant...');
        const deleted = await deleteAttribute('paymentSplits');
        if (!deleted) {
            console.log('❌ Échec de la mise à jour, impossible de supprimer l\'attribut existant');
            return;
        }
        
        // Attendre un peu pour s'assurer que la suppression est bien prise en compte
        console.log('⏳ Attente de la prise en compte de la suppression...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
        console.log('ℹ️ Attribut paymentSplits non trouvé, création d\'un nouvel attribut');
    }

    // 4. Créer un nouvel attribut pour stocker les paiements
    console.log('🔄 Création d\'un nouvel attribut pour stocker les paiements...');
    
    // Option 1: Utiliser un seul attribut de type string pour stocker un JSON
    console.log('🔄 Création de l\'attribut paymentSplitsJson (texte unique)...');
    const success1 = await createStringAttribute('paymentSplitsJson', false, null, 16000, false);
    
    // Option 2: Créer des attributs séparés pour les différents types de paiement
    console.log('🔄 Création des attributs pour chaque méthode de paiement...');
    const paymentMethods = ['especes', 'carte', 'wave', 'orange_money', 'cheque', 'cheque_cadeau', 'virement'];
    const success2 = await Promise.all(paymentMethods.map(method => 
        createStringAttribute(`payment_${method}`, false, null, 255, false)
    ));
    
    if (success1) {
        console.log('✅ Solution 1: Utiliser paymentSplitsJson pour stocker les données de paiement au format JSON');
        console.log('   Exemple: paymentSplitsJson = \'[{"method":"especes","amount":1000},{"method":"carte","amount":500}]\'');
    }
    
    if (success2.every(Boolean)) {
        console.log('✅ Solution 2: Utiliser des attributs séparés pour chaque méthode de paiement');
        console.log('   Exemple: payment_especes = "1000", payment_carte = "500"');
    }
    
    console.log('\n🔄 Modification nécessaire dans le code:');
    console.log('1. Modifier la fonction handleSubmit dans NewSaleModal.tsx pour utiliser paymentSplitsJson');
    console.log('   Exemple: paymentSplitsJson: JSON.stringify(payments)');
    console.log('   OU');
    console.log('2. Modifier la fonction handleSubmit pour utiliser les attributs séparés');
    console.log('   Exemple: payment_especes: "1000", payment_carte: "500"');
    
    console.log('\n🎉 La collection sales est maintenant prête avec les nouvelles options de stockage des paiements');
})();
