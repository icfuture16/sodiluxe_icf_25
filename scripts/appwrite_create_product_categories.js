// Script Node.js pour créer la collection product_categories et ses attributs
// Nécessite: npm install node-fetch@2

const fetch = require('node-fetch');

const PROJECT_ID = '6856f8aa00281cb47665';
const API_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const API_KEY = 'standard_4c24e91366984ffd2c2c09a0ed2d3527382fde636b7ea60c867a10467fb58ec942be378668988ad3cdc4993bf2f6839e75a7467b0771f3c8e899d0f1b3b063946c7ef195972d58310ccbbf899423fdd94ceda4b1e3a88c8c691d716e105890966f552b942cdf76360ae311305dae2559d92afe1ab64367f927af580263d63dc2';
const DATABASE_ID = '68599714002eef233c16';
const COLLECTION_ID = 'product_categories';

async function createCollection() {
  const url = `${API_ENDPOINT}/databases/${DATABASE_ID}/collections`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collectionId: COLLECTION_ID,
      name: 'Catégories Produits',
      permissions: [], // A personnaliser si besoin
      documentSecurity: false
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    if (err.includes('already exists')) {
      console.log('La collection existe déjà.');
      return;
    }
    throw new Error(`Erreur création collection: ${res.status} ${err}`);
  }
  console.log('Collection créée ou déjà existante.');
}

const ATTRIBUTES = [
  { key: 'name', type: 'string', size: 64, required: true },
  { key: 'brand', type: 'string', size: 64, required: false },
  { key: 'active', type: 'boolean', required: false }
];

async function createAttribute(attr) {
  const url = `${API_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/${attr.type}`;
  const body = {
    key: attr.key,
    required: attr.required,
    ...(attr.size ? { size: attr.size } : {})
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    if (err.includes('already exists')) {
      console.log(`L'attribut ${attr.key} existe déjà.`);
      return;
    }
    throw new Error(`Erreur création attribut ${attr.key}: ${res.status} ${err}`);
  }
  console.log(`Attribut ${attr.key} créé ou déjà existant.`);
}

(async () => {
  try {
    await createCollection();
    for (const attr of ATTRIBUTES) {
      await createAttribute(attr);
    }
    console.log('Terminé. Vérifiez la collection product_categories dans la console Appwrite.');
  } catch (e) {
    console.error(e.message);
  }
})();
