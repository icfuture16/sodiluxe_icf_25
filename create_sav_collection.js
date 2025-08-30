// Script pour créer la collection SAV via l'API Appwrite
// Exécuter avec: node create_sav_collection.js

const axios = require('axios');

// Configuration depuis infos_utiles.txt
const config = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '6856f8aa00281cb47665',
  apiKey: 'standard_4c24e91366984ffd2c2c09a0ed2d3527382fde636b7ea60c867a10467fb58ec942be378668988ad3cdc4993bf2f6839e75a7467b0771f3c8e899d0f1b3b063946c7ef195972d58310ccbbf899423fdd94ceda4b1e3a88c8c691d716e105890966f552b942cdf76360ae311305dae2559d92afe1ab64367f927af580263d63dc2',
  databaseId: '68599714002eef233c16',
  collectionId: 'after_sales_service'
};

// Headers pour toutes les requêtes
const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': config.projectId,
  'X-Appwrite-Key': config.apiKey
};

// 1. Créer la collection
async function createCollection() {
  try {
    const response = await axios({
      method: 'post',
      url: `${config.endpoint}/databases/${config.databaseId}/collections`,
      headers,
      data: {
        collectionId: config.collectionId,
        name: 'Service Après-Vente',
        permissions: [
          "read(\"any\")",
          "create(\"any\")",
          "update(\"any\")",
          "delete(\"any\")"
        ]
      }
    });
    
    console.log('Collection créée avec succès:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création de la collection:', error.response?.data || error.message);
    // Si la collection existe déjà, on continue
    if (error.response?.status === 409) {
      console.log('La collection existe déjà, on continue avec les attributs...');
      return { $id: config.collectionId };
    }
    throw error;
  }
}

// 2. Créer un attribut string
async function createStringAttribute(key, size, required) {
  try {
    const response = await axios({
      method: 'post',
      url: `${config.endpoint}/databases/${config.databaseId}/collections/${config.collectionId}/attributes/string`,
      headers,
      data: {
        key,
        size,
        required
      }
    });
    
    console.log(`Attribut string '${key}' créé avec succès`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la création de l'attribut string '${key}':`, error.response?.data || error.message);
    // Si l'attribut existe déjà, on continue
    if (error.response?.status === 409) {
      console.log(`L'attribut '${key}' existe déjà, on continue...`);
      return { key };
    }
    throw error;
  }
}

// 3. Créer un attribut enum
async function createEnumAttribute(key, elements, required) {
  try {
    const response = await axios({
      method: 'post',
      url: `${config.endpoint}/databases/${config.databaseId}/collections/${config.collectionId}/attributes/enum`,
      headers,
      data: {
        key,
        elements,
        required
      }
    });
    
    console.log(`Attribut enum '${key}' créé avec succès`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la création de l'attribut enum '${key}':`, error.response?.data || error.message);
    // Si l'attribut existe déjà, on continue
    if (error.response?.status === 409) {
      console.log(`L'attribut '${key}' existe déjà, on continue...`);
      return { key };
    }
    throw error;
  }
}

// Fonction principale pour créer la collection et tous les attributs
async function createSAVCollection() {
  try {
    // 1. Créer la collection
    await createCollection();
    
    // 2. Créer les attributs string obligatoires
    await createStringAttribute('date', 20, true);
    await createStringAttribute('storeId', 36, true);
    await createStringAttribute('storeName', 100, true);
    await createStringAttribute('clientId', 36, true);
    await createStringAttribute('clientName', 100, true);
    await createStringAttribute('productId', 36, true);
    await createStringAttribute('productName', 100, true);
    await createStringAttribute('issueDescription', 500, true);
    
    // 3. Créer les attributs string optionnels
    await createStringAttribute('sellerId', 36, false);
    await createStringAttribute('sellerName', 100, false);
    await createStringAttribute('technicianId', 36, false);
    await createStringAttribute('technicianName', 100, false);
    await createStringAttribute('estimatedCompletionDate', 20, false);
    await createStringAttribute('completionDate', 20, false);
    await createStringAttribute('notes', 1000, false);
    
    // 4. Créer les attributs enum
    await createEnumAttribute('issueType', ['réparation', 'échange', 'remboursement', 'autre'], true);
    await createEnumAttribute('status', ['nouvelle', 'en_attente', 'en_cours', 'terminée', 'annulée'], true);
    await createEnumAttribute('priority', ['high', 'medium', 'low'], true);
    
    console.log('✅ Collection SAV et tous les attributs créés avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la création de la collection SAV:', error);
  }
}

// Exécuter le script
createSAVCollection();
