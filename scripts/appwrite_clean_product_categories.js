// Script pour supprimer les documents vides ou sans champ 'name' dans product_categories
const fetch = require('node-fetch');

const PROJECT_ID = '6856f8aa00281cb47665';
const API_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const API_KEY = 'standard_4c24e91366984ffd2c2c09a0ed2d3527382fde636b7ea60c867a10467fb58ec942be378668988ad3cdc4993bf2f6839e75a7467b0771f3c8e899d0f1b3b063946c7ef195972d58310ccbbf899423fdd94ceda4b1e3a88c8c691d716e105890966f552b942cdf76360ae311305dae2559d92afe1ab64367f927af580263d63dc2';
const DATABASE_ID = '68599714002eef233c16';
const COLLECTION_ID = 'product_categories';

async function listCategories() {
  const res = await fetch(`${API_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?limit=100`, {
    headers: {
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': API_KEY
    }
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.documents;
}

async function deleteCategory(id) {
  const res = await fetch(`${API_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': API_KEY
    }
  });
  if (!res.ok) throw new Error(await res.text());
  console.log(`Supprimé: ${id}`);
}

(async () => {
  const docs = await listCategories();
  let deleted = 0;
  for (const doc of docs) {
    if (!doc.name || typeof doc.name !== 'string' || doc.name.trim() === '') {
      await deleteCategory(doc.$id);
      deleted++;
    }
  }
  console.log(`Nettoyage terminé. ${deleted} document(s) supprimé(s).`);
})();
