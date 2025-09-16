const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config();
const { DATABASE_ID, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Clients de test
const testClients = [
  {
    email: 'jean.dupont@email.com',
    fullName: 'Jean Dupont',
    phone: '+221 77 123 45 67',
    address: '123 Rue de la Paix, Dakar',
    gender: 'homme',
    loyaltyPoints: 150,
    totalSpent: 75000,
    segment: 'silver',
    vipStatus: false
  },
  {
    email: 'marie.martin@email.com',
    fullName: 'Marie Martin',
    phone: '+221 76 987 65 43',
    address: '456 Avenue Bourguiba, Dakar',
    gender: 'femme',
    loyaltyPoints: 300,
    totalSpent: 150000,
    segment: 'gold',
    vipStatus: true
  },
  {
    email: 'amadou.ba@email.com',
    fullName: 'Amadou Ba',
    phone: '+221 78 555 44 33',
    address: '789 Boulevard de la République, Dakar',
    gender: 'homme',
    loyaltyPoints: 50,
    totalSpent: 25000,
    segment: 'bronze',
    vipStatus: false
  },
  {
    email: 'fatou.diop@email.com',
    fullName: 'Fatou Diop',
    phone: '+221 77 888 99 00',
    address: '321 Rue Félix Faure, Dakar',
    gender: 'femme',
    loyaltyPoints: 500,
    totalSpent: 250000,
    segment: 'premium',
    vipStatus: true
  },
  {
    email: 'entreprise.abc@email.com',
    fullName: 'Entreprise ABC SARL',
    phone: '+221 33 123 45 67',
    address: '555 Zone Industrielle, Dakar',
    gender: 'entreprise',
    loyaltyPoints: 1000,
    totalSpent: 500000,
    segment: 'premium',
    vipStatus: true
  }
];

async function createTestClients() {
  try {
    console.log('Création des clients de test...');
    
    for (const clientData of testClients) {
      try {
        const client = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.CLIENTS,
          ID.unique(),
          clientData
        );
        console.log(`✅ Client créé: ${clientData.fullName} (ID: ${client.$id})`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️  Client déjà existant: ${clientData.fullName}`);
        } else {
          console.error(`❌ Erreur lors de la création de ${clientData.fullName}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Processus de création des clients terminé!');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
if (require.main === module) {
  createTestClients();
}

module.exports = { createTestClients };

