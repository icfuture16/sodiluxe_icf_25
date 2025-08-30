const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

// Configuration Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = 'after_sales_service';

async function updateSavCollectionStructure() {
  try {
    console.log('🔄 Mise à jour de la structure de la collection SAV...');
    
    // 1. Supprimer les attributs liés aux techniciens
    const attributesToDelete = [
      'technicianId',
      'technicianName', 
      'isTechnicianList',
      'technicians'
    ];
    
    for (const attribute of attributesToDelete) {
      try {
        await databases.deleteAttribute(DATABASE_ID, COLLECTION_ID, attribute);
        console.log(`✅ Attribut '${attribute}' supprimé avec succès`);
      } catch (error) {
        if (error.code === 404) {
          console.log(`⚠️  Attribut '${attribute}' n'existe pas, ignoré`);
        } else {
          console.error(`❌ Erreur lors de la suppression de '${attribute}':`, error.message);
        }
      }
    }
    
    // 2. Ajouter l'attribut user_seller
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        'user_seller',
        15, // Taille maximale pour user_seller
        false, // Non requis pour permettre la migration
        null, // Pas de valeur par défaut
        false // Pas un tableau
      );
      console.log('✅ Attribut user_seller ajouté avec succès');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Attribut user_seller existe déjà');
      } else {
        console.error('❌ Erreur lors de l\'ajout de user_seller:', error.message);
      }
    }
    
    console.log('\n🎉 Mise à jour de la structure terminée!');
    console.log('\n📝 Prochaines étapes:');
    console.log('1. Exécuter le script de migration des données existantes');
    console.log('2. Tester la création de nouvelles demandes SAV');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution du script
if (require.main === module) {
  updateSavCollectionStructure();
}

module.exports = { updateSavCollectionStructure };