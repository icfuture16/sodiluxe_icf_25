/**
 * Script de diagnostic pour la collection reservation_items dans Appwrite
 * Vérifie la structure actuelle et identifie les attributs manquants
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

// Configuration Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const COLLECTION_ID = 'reservation_items';

// Attributs attendus selon ReservationItemInput
const EXPECTED_ATTRIBUTES = {
  reservationId: { type: 'string', required: true },
  productId: { type: 'string', required: true },
  quantity: { type: 'integer', required: true },
  unitPrice: { type: 'double', required: true },
  discountPercentage: { type: 'double', required: false, default: 0 },
  notes: { type: 'string', required: false }
};

async function diagnoseCollection() {
  try {
    console.log('🔍 Diagnostic de la collection reservation_items...');
    console.log('=' .repeat(60));

    // 1. Vérifier si la collection existe
    console.log('\n1. Vérification de l\'existence de la collection...');
    let collection;
    try {
      collection = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
      console.log('✅ Collection trouvée:', collection.name);
      console.log('   ID:', collection.$id);
      console.log('   Créée le:', new Date(collection.$createdAt).toLocaleString());
    } catch (error) {
      console.log('❌ Collection non trouvée:', error.message);
      return;
    }

    // 2. Lister tous les attributs existants
    console.log('\n2. Attributs existants dans la collection:');
    const existingAttributes = collection.attributes || [];
    
    if (existingAttributes.length === 0) {
      console.log('⚠️  Aucun attribut trouvé dans la collection!');
    } else {
      existingAttributes.forEach(attr => {
        console.log(`   - ${attr.key}:`);
        console.log(`     Type: ${attr.type}`);
        console.log(`     Requis: ${attr.required}`);
        if (attr.default !== undefined) {
          console.log(`     Défaut: ${attr.default}`);
        }
        if (attr.size) {
          console.log(`     Taille: ${attr.size}`);
        }
      });
    }

    // 3. Comparer avec les attributs attendus
    console.log('\n3. Comparaison avec les attributs attendus:');
    const existingAttrNames = existingAttributes.map(attr => attr.key);
    const missingAttributes = [];
    const incorrectAttributes = [];

    Object.entries(EXPECTED_ATTRIBUTES).forEach(([attrName, expectedConfig]) => {
      const existingAttr = existingAttributes.find(attr => attr.key === attrName);
      
      if (!existingAttr) {
        missingAttributes.push({ name: attrName, config: expectedConfig });
        console.log(`❌ Manquant: ${attrName} (${expectedConfig.type}, requis: ${expectedConfig.required})`);
      } else {
        // Vérifier si le type correspond
        if (existingAttr.type !== expectedConfig.type || existingAttr.required !== expectedConfig.required) {
          incorrectAttributes.push({
            name: attrName,
            existing: { type: existingAttr.type, required: existingAttr.required },
            expected: expectedConfig
          });
          console.log(`⚠️  Incorrect: ${attrName}`);
          console.log(`     Existant: ${existingAttr.type}, requis: ${existingAttr.required}`);
          console.log(`     Attendu: ${expectedConfig.type}, requis: ${expectedConfig.required}`);
        } else {
          console.log(`✅ Correct: ${attrName}`);
        }
      }
    });

    // 4. Attributs supplémentaires non attendus
    const extraAttributes = existingAttrNames.filter(name => !Object.keys(EXPECTED_ATTRIBUTES).includes(name));
    if (extraAttributes.length > 0) {
      console.log('\n4. Attributs supplémentaires (non attendus):');
      extraAttributes.forEach(attr => {
        console.log(`   ℹ️  ${attr}`);
      });
    }

    // 5. Générer les commandes pour corriger
    console.log('\n5. Actions recommandées:');
    
    if (missingAttributes.length === 0 && incorrectAttributes.length === 0) {
      console.log('✅ Aucune action requise - la collection est correctement configurée!');
    } else {
      console.log('\n📝 Commandes à exécuter pour corriger la collection:');
      
      // Commandes pour ajouter les attributs manquants
      missingAttributes.forEach(({ name, config }) => {
        let command;
        switch (config.type) {
          case 'string':
            command = `await databases.createStringAttribute('${DATABASE_ID}', '${COLLECTION_ID}', '${name}', 255, ${config.required});`;
            break;
          case 'integer':
            command = `await databases.createIntegerAttribute('${DATABASE_ID}', '${COLLECTION_ID}', '${name}', ${config.required});`;
            break;
          case 'double':
            const defaultValue = config.default !== undefined ? `, ${config.default}` : '';
            command = `await databases.createFloatAttribute('${DATABASE_ID}', '${COLLECTION_ID}', '${name}', ${config.required}${defaultValue});`;
            break;
        }
        console.log(`   ${command}`);
      });

      // Note sur les attributs incorrects
      if (incorrectAttributes.length > 0) {
        console.log('\n⚠️  Attributs avec types/propriétés incorrects détectés.');
        console.log('   Ces attributs nécessitent une suppression et recréation:');
        incorrectAttributes.forEach(({ name }) => {
          console.log(`   - ${name}`);
        });
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🏁 Diagnostic terminé');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le diagnostic
if (require.main === module) {
  diagnoseCollection();
}

module.exports = { diagnoseCollection };