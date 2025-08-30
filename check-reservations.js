const { Client, Databases } = require('appwrite');

// Configuration Appwrite
const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6859970c0026b8b3b8b5');

const databases = new Databases(client);
const DATABASE_ID = '68599714002eef233c16';
const RESERVATIONS_COLLECTION = 'reservations';

async function checkReservationsCollection() {
  try {
    console.log('Vérification de la collection reservations...');
    const collection = await databases.getCollection(DATABASE_ID, RESERVATIONS_COLLECTION);
    
    console.log('\n=== STRUCTURE DE LA COLLECTION RESERVATIONS ===');
    console.log('ID:', collection.$id);
    console.log('Nom:', collection.name);
    console.log('\nAttributs:');
    
    if (collection.attributes && collection.attributes.length > 0) {
      collection.attributes.forEach(attr => {
        console.log(`- ${attr.key}: ${attr.type}${attr.required ? ' (requis)' : ' (optionnel)'}`);
      });
    } else {
      console.log('Aucun attribut trouvé');
    }
    
    // Vérifier spécifiquement si depositAmount existe
    const hasDepositAmount = collection.attributes?.some(attr => attr.key === 'depositAmount');
    console.log('\nAttribut depositAmount présent:', hasDepositAmount ? 'OUI' : 'NON');
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error.message);
  }
}

checkReservationsCollection();