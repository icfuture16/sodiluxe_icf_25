const { Client, Databases, Query } = require('appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);
const DATABASE_ID = '68599714002eef233c16';

async function testCollections() {
  console.log('🔍 Test des collections disponibles...');
  
  const collections = ['sellers', 'users', 'sales', 'clients', 'stores'];
  
  for (const collectionName of collections) {
    try {
      const result = await databases.listDocuments(DATABASE_ID, collectionName, [
        Query.limit(1)
      ]);
      console.log(`✅ Collection '${collectionName}': ${result.documents.length} documents (accessible)`);
      
      if (result.documents.length > 0 && (collectionName === 'sellers' || collectionName === 'users')) {
        const doc = result.documents[0];
        console.log(`   Premier document:`, {
          id: doc.$id,
          email: doc.email || 'N/A',
          fullName: doc.fullName || 'N/A',
          name: doc.name || 'N/A'
        });
      }
    } catch (error) {
      if (error.code === 404) {
        console.log(`❌ Collection '${collectionName}': n'existe pas`);
      } else {
        console.log(`❌ Collection '${collectionName}': ${error.message}`);
      }
    }
  }
}

testCollections();