/**
 * Script pour étendre la collection sales avec les attributs nécessaires à l'unification
 * Ce script ajoute le champ isCredit et tous les champs spécifiques aux ventes à crédit
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Databases } = require('node-appwrite');
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Vérification des variables d'environnement requises
if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
  console.error('Erreur: Variables d\'environnement manquantes.');
  console.error('Veuillez définir les variables suivantes dans le fichier .env.local:');
  console.error('- NEXT_PUBLIC_APPWRITE_ENDPOINT');
  console.error('- NEXT_PUBLIC_APPWRITE_PROJECT_ID');
  console.error('- APPWRITE_API_KEY');
  process.exit(1);
}

// Configuration du client Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Définition des nouveaux attributs à ajouter à la collection sales
const newAttributes = [
  // Champ principal pour différencier les ventes normales des ventes à crédit
  { key: 'isCredit', type: 'boolean', required: false, default: false },
  
  // Champs spécifiques aux ventes à crédit (tous optionnels)
  { key: 'paidAmount', type: 'float', required: false },
  { key: 'remainingAmount', type: 'float', required: false },
  { key: 'initialPayment', type: 'float', required: false },
  { key: 'numberOfInstallments', type: 'integer', required: false, min: 1 },
  
  // Informations du garant
  { key: 'guarantorName', type: 'string', required: false, size: 255 },
  { key: 'guarantorContact', type: 'string', required: false, size: 255 },
  { key: 'guarantorRelation', type: 'string', required: false, size: 255 },
  
  // Détails des paiements par méthode
  { key: 'payment_especes', type: 'float', required: false },
  { key: 'payment_carte', type: 'float', required: false },
  { key: 'payment_cheque', type: 'float', required: false },
  { key: 'payment_virement', type: 'float', required: false },
  { key: 'payment_mobile', type: 'float', required: false },
  { key: 'payment_credit', type: 'float', required: false },
  { key: 'payment_autre', type: 'float', required: false },
  
  // Points de fidélité
  { key: 'loyaltyPointsEarned', type: 'integer', required: false, min: 0, default: 0 },
  { key: 'loyaltyPointsUsed', type: 'integer', required: false, min: 0, default: 0 },
  
  // Notes additionnelles
  { key: 'notes', type: 'string', required: false, size: 1000 }
];

// Fonction pour vérifier si un attribut existe déjà
async function attributeExists(collectionId, attributeKey) {
  try {
    const collection = await databases.getCollection(DATABASE_ID, collectionId);
    return collection.attributes.some(attr => attr.key === attributeKey);
  } catch (error) {
    console.error(`Erreur lors de la vérification de l'attribut ${attributeKey}:`, error.message);
    return false;
  }
}

// Fonction pour ajouter un attribut à la collection
async function addAttribute(collectionId, attr) {
  try {
    console.log(`    - Ajout de l'attribut ${attr.key} (${attr.type})...`);
    
    // Vérifier si l'attribut existe déjà
    const exists = await attributeExists(collectionId, attr.key);
    if (exists) {
      console.log(`    ✓ L'attribut ${attr.key} existe déjà.`);
      return;
    }
    
    // Ajouter l'attribut selon son type
    if (attr.type === 'boolean') {
      await databases.createBooleanAttribute(
        DATABASE_ID,
        collectionId,
        attr.key,
        attr.required,
        attr.default,
        attr.array || false
      );
    } else if (attr.type === 'string') {
      await databases.createStringAttribute(
        DATABASE_ID,
        collectionId,
        attr.key,
        attr.size || 255,
        attr.required,
        attr.default,
        attr.array || false
      );
    } else if (attr.type === 'integer') {
      await databases.createIntegerAttribute(
        DATABASE_ID,
        collectionId,
        attr.key,
        attr.required,
        attr.min,
        attr.max,
        attr.default,
        attr.array || false
      );
    } else if (attr.type === 'float') {
      await databases.createFloatAttribute(
        DATABASE_ID,
        collectionId,
        attr.key,
        attr.required,
        attr.min,
        attr.max,
        attr.default,
        attr.array || false
      );
    } else if (attr.type === 'datetime') {
      await databases.createDatetimeAttribute(
        DATABASE_ID,
        collectionId,
        attr.key,
        attr.required,
        attr.default,
        attr.array || false
      );
    }
    
    console.log(`    ✓ Attribut ${attr.key} ajouté avec succès.`);
  } catch (error) {
    console.error(`    ✗ Erreur lors de l'ajout de l'attribut ${attr.key}:`, error.message);
    throw error;
  }
}

// Fonction principale pour étendre la collection sales
async function extendSalesCollection() {
  try {
    console.log('Extension de la collection sales pour l\'unification...');
    console.log('='.repeat(60));
    
    // Vérifier que la collection sales existe
    try {
      await databases.getCollection(DATABASE_ID, COLLECTIONS.SALES);
      console.log(`✓ Collection sales trouvée (ID: ${COLLECTIONS.SALES})`);
    } catch (error) {
      if (error.code === 404) {
        console.error('✗ La collection sales n\'existe pas. Veuillez d\'abord créer la collection sales.');
        process.exit(1);
      }
      throw error;
    }
    
    console.log('\nAjout des nouveaux attributs...');
    
    // Ajouter chaque attribut
    for (const attr of newAttributes) {
      await addAttribute(COLLECTIONS.SALES, attr);
      // Petite pause pour éviter les limitations de taux
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Extension de la collection sales terminée avec succès!');
    console.log('\nLa collection sales contient maintenant:');
    console.log('- Le champ isCredit pour différencier les types de ventes');
    console.log('- Tous les champs spécifiques aux ventes à crédit comme optionnels');
    console.log('- Les détails de paiement par méthode');
    console.log('- Les informations du garant');
    console.log('- Les points de fidélité');
    console.log('- Les notes additionnelles');
    console.log('\nÉtape suivante: Exécuter le script de migration des données.');
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Erreur lors de l\'extension de la collection sales:', error.message);
    console.error('\nVeuillez vérifier:');
    console.error('- Que les variables d\'environnement sont correctement configurées');
    console.error('- Que la clé API a les permissions nécessaires');
    console.error('- Que la collection sales existe');
    process.exit(1);
  }
}

// Exécuter la fonction principale
extendSalesCollection().catch(error => {
  console.error('Erreur inattendue:', error);
  process.exit(1);
});