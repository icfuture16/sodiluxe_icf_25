const fs = require('fs');
const path = require('path');
const nodeFetch = require('node-fetch');
// Chargement automatique du .env si présent
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
} catch (e) { /* ignore */ }


// À adapter selon votre config
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'default';

function checkEnvVars() {
  if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID) {
    console.error('[EXPORT] Variable(s) d\'environnement manquante(s) :');
    if (!ENDPOINT) console.error('  - NEXT_PUBLIC_APPWRITE_ENDPOINT');
    if (!PROJECT_ID) console.error('  - NEXT_PUBLIC_APPWRITE_PROJECT_ID');
    if (!API_KEY) console.error('  - APPWRITE_API_KEY');
    if (!DATABASE_ID) console.error('  - APPWRITE_DATABASE_ID');
    process.exit(1);
  }
}



// Liste manuelle des collections à exporter (cf. screenshot)
const COLLECTIONS = [
  'after_sales_service',
  'product_categories',
  'debit_sales',
  'objectives',
  'reservations',
  'categories',
  'stock_alerts',
  'inventories',
  'stock_movements',
  'stock',
  'reservation_items',
  'access_codes',
  'sale_items',
  'sales',
  'products',
  'clients',
  'users',
  'stores',
];

async function fetchAllDocuments(collectionId: string) {
  let documents: any[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const url = `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents?limit=${limit}&offset=${offset}`;
    const res = await nodeFetch(url, {
      headers: {
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY,
        'content-type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`Erreur export ${collectionId}: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    documents = documents.concat(json.documents || []);
    offset += limit;
    hasMore = (json.documents || []).length === limit;
  }
  return documents;
}

async function exportAllCollections() {
  checkEnvVars();
  const exportData: Record<string, any[]> = {};
  for (const collectionId of COLLECTIONS) {
    console.log(`Export de ${collectionId}...`);
    try {
      exportData[collectionId] = await fetchAllDocuments(collectionId);
    } catch (e) {
      console.error(`Erreur export ${collectionId}:`, e);
      exportData[collectionId] = [];
    }
  }
  // Écriture dans un seul gros fichier JSON
  const outDir = path.resolve(__dirname, '../exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outPath = path.join(outDir, `appwrite_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2), 'utf-8');
  console.log(`Export terminé : ${outPath}`);
}

exportAllCollections().catch((err) => {
  console.error('Erreur export global:', err);
  process.exit(1);
});

