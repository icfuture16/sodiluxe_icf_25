// Script pour supprimer les documents vides ou sans champ 'name' dans product_categories
const fetch = require('node-fetch');

const PROJECT_ID = '68bf1c29001d20f7444d';
const API_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const API_KEY = 'standard_7c860836bcc01137b6f2bac843cb0996bdb7d67d58e613ee92b26122296b0b7b42da7bbee2748b0b15c86f672a56e59ef5ebc21946625940759df6dc5396d43d0fb84c7535b3789f0ff54bc125305d06936ea9cbefec68dd0714dac4889fbeb630687ad2873aea1050bec1140c600a89d14e6cdfdffc6203509b14de4d897ad3';
const DATABASE_ID = '68bf1e7b003c6b340d6e';
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

