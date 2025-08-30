// Script pour corriger automatiquement les permissions de la collection objectives dans Appwrite
// Nécessite: npm install node-fetch@2

const fetch = require('node-fetch');

const PROJECT_ID = '6856f8aa00281cb47665';
const API_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const API_KEY = 'standard_4c24e91366984ffd2c2c09a0ed2d3527382fde636b7ea60c867a10467fb58ec942be378668988ad3cdc4993bf2f6839e75a7467b0771f3c8e899d0f1b3b063946c7ef195972d58310ccbbf899423fdd94ceda4b1e3a88c8c691d716e105890966f552b942cdf76360ae311305dae2559d92afe1ab64367f927af580263d63dc2';
const DATABASE_ID = '68599714002eef233c16';
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
