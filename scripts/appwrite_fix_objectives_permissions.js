// Script pour corriger automatiquement les permissions de la collection objectives dans Appwrite
// Nécessite: npm install node-fetch@2

const fetch = require('node-fetch');

const PROJECT_ID = '68bf1c29001d20f7444d';
const API_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const API_KEY = 'standard_7c860836bcc01137b6f2bac843cb0996bdb7d67d58e613ee92b26122296b0b7b42da7bbee2748b0b15c86f672a56e59ef5ebc21946625940759df6dc5396d43d0fb84c7535b3789f0ff54bc125305d06936ea9cbefec68dd0714dac4889fbeb630687ad2873aea1050bec1140c600a89d14e6cdfdffc6203509b14de4d897ad3';
const DATABASE_ID = '68bf1e7b003c6b340d6e';
const COLLECTION_ID = 'objectives';

async function patchPermissions() {
  const url = `${API_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      permissions: [
        'read("role:users")',
        'write("role:users")',
        'update("role:users")',
        'delete("role:users")'
      ]
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erreur lors de la mise à jour des permissions: ${res.status} ${err}`);
  }
  console.log('Permissions corrigées sur la collection objectives.');
}

patchPermissions().catch(e => console.error(e));

