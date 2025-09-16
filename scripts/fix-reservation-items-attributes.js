/**
 * Script pour ajouter les attributs manquants à la collection reservation_items
 * Basé sur le diagnostic effectué
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

async function addMissingAttributes() {
  try {
    console.log('🔧 Ajout des attributs manquants à la collection reservation_items...');
    console.log('=' .repeat(60));

    // 1. Ajouter l'attribut quantity (integer, requis)
    console.log('\n1. Ajout de l\'attribut quantity...');
    try {
      await databases.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, 'quantity', true);
      console.log('✅ Attribut quantity ajouté avec succès');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Attribut quantity déjà existant');
      } else {
        console.error('❌ Erreur lors de l\'ajout de quantity:', error.message);
        throw error;
      }
    }

    // Attendre un peu entre les créations d'attributs
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Ajouter l'attribut unitPrice (double, requis)
    console.log('\n2. Ajout de l\'attribut unitPrice...');
    try {
      await databases.createFloatAttribute(DATABASE_ID, COLLECTION_ID, 'unitPrice', true);
      console.log('✅ Attribut unitPrice ajouté avec succès');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Attribut unitPrice déjà existant');
      } else {
        console.error('❌ Erreur lors de l\'ajout de unitPrice:', error.message);
        throw error;
      }
    }

    // Attendre un peu entre les créations d'attributs
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Ajouter l'attribut notes (string, optionnel)
    console.log('\n3. Ajout de l\'attribut notes...');
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'notes', 255, false);
      console.log('✅ Attribut notes ajouté avec succès');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Attribut notes déjà existant');
      } else {
        console.error('❌ Erreur lors de l\'ajout de notes:', error.message);
        throw error;
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Tous les attributs manquants ont été ajoutés avec succès!');
    console.log('\n📋 Résumé des attributs de la collection reservation_items:');
    console.log('   - reservationId (string, requis)');
    console.log('   - productId (string, requis)');
    console.log('   - quantity (integer, requis) ← AJOUTÉ');
    console.log('   - unitPrice (double, requis) ← AJOUTÉ');
    console.log('   - discountPercentage (double, optionnel)');
    console.log('   - notes (string, optionnel) ← AJOUTÉ');
    
    console.log('\n✅ La collection est maintenant compatible avec ReservationItemInput!');

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des attributs:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  addMissingAttributes();
}

module.exports = { addMissingAttributes };

