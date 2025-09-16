const { Client, Databases } = require('appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);
const DATABASE_ID = '68bf1e7b003c6b340d6e';
const USERS_COLLECTION_ID = 'users';

async function addDisplayNameAttribute() {
  console.log('🔧 Ajout de l\'attribut displayName à la collection users...');
  
  try {
    // Ajouter l'attribut displayName (optionnel)
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      'displayName',
      255, // taille maximale
      false, // non requis
      null, // pas de valeur par défaut
      false // pas un tableau
    );
    
    console.log('✅ Attribut displayName ajouté avec succès à la collection users');
    console.log('📝 Cet attribut peut être utilisé pour stocker un nom d\'affichage personnalisé pour les vendeurs');
    
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  L\'attribut displayName existe déjà dans la collection users');
    } else {
      console.error('❌ Erreur lors de l\'ajout de l\'attribut displayName:', error.message);
    }
  }
}

async function listCurrentAttributes() {
  console.log('\n📋 Attributs actuels de la collection users:');
  
  try {
    const collection = await databases.getCollection(DATABASE_ID, USERS_COLLECTION_ID);
    
    collection.attributes.forEach(attr => {
      console.log(`   - ${attr.key}: ${attr.type} ${attr.required ? '(requis)' : '(optionnel)'}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des attributs:', error.message);
  }
}

async function main() {
  console.log('🚀 Script d\'ajout d\'attribut displayName à la collection users\n');
  
  await listCurrentAttributes();
  await addDisplayNameAttribute();
  await listCurrentAttributes();
  
  console.log('\n✨ Script terminé!');
}

main().catch(console.error);

