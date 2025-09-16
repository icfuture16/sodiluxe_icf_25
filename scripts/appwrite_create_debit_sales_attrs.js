// Script Node.js pour ajouter les attributs nécessaires à la collection debit_sales
// Nécessite: npm install node-fetch@2

const fetch = require('node-fetch');

const PROJECT_ID = '68bf1c29001d20f7444d';
const API_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const API_KEY = 'standard_7c860836bcc01137b6f2bac843cb0996bdb7d67d58e613ee92b26122296b0b7b42da7bbee2748b0b15c86f672a56e59ef5ebc21946625940759df6dc5396d43d0fb84c7535b3789f0ff54bc125305d06936ea9cbefec68dd0714dac4889fbeb630687ad2873aea1050bec1140c600a89d14e6cdfdffc6203509b14de4d897ad3';
const DATABASE_ID = '68bf1e7b003c6b340d6e';
const COLLECTION_ID = 'debit_sales';

const ATTRIBUTES = [
  { key: 'storeId', type: 'string', size: 64, required: true },
  { key: 'clientId', type: 'string', size: 64, required: true },
  { key: 'sellerId', type: 'string', size: 64, required: true },
  { key: 'date', type: 'string', size: 32, required: true },
  { key: 'amount', type: 'double', required: true },
  { key: 'amountDue', type: 'double', required: true },
  { key: 'status', type: 'string', size: 16, required: true },
  { key: 'dueDate', type: 'string', size: 32, required: true },
  { key: 'notes', type: 'string', size: 512, required: false }
];

async function createAttribute(attr) {
  const url = `${API_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/${attr.type}`;
  const body = {
    key: attr.key,
    required: attr.required,
    ...(attr.size ? { size: attr.size } : {}),
    ...(attr.type === 'string' && attr.size ? { size: attr.size } : {}),
    ...(attr.type === 'double' ? { } : {})
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
    throw new Error(`Erreur création attribut ${attr.key}: ${res.status} ${err}`);
  }
  return res.json();
}

(async () => {
  for (const attr of ATTRIBUTES) {
    try {
      console.log(`Ajout de l'attribut ${attr.key}...`);
      await createAttribute(attr);
      console.log(`✔️  ${attr.key} ajouté.`);
    } catch (e) {
      console.error(e.message);
    }
  }
  console.log('Terminé. Vérifiez la collection debit_sales dans la console Appwrite.');
})();

