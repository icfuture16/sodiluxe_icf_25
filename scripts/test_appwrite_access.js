const { Client, Databases } = require('appwrite');
require('dotenv').config({ path: '../.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

if (process.env.APPWRITE_API_KEY && typeof client.setKey === 'function') {
  client.setKey(process.env.APPWRITE_API_KEY);
}

const databases = new Databases(client);
const dbId = process.env.APPWRITE_DATABASE_ID || '68bf1e7b003c6b340d6e';

async function test() {
  try {
    const sales = await databases.listDocuments(dbId, 'sales');
    const sav = await databases.listDocuments(dbId, 'after_sales_service');
    console.log('SALES:', sales.documents.length, sales.documents.map(d => d.$id));
    console.log('SAV:', sav.documents.length, sav.documents.map(d => d.$id));
  } catch (e) {
    console.error('ERROR:', e);
  }
}

test();

