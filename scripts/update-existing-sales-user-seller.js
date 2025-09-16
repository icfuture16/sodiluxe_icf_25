/**
 * Script pour mettre à jour les ventes existantes avec l'attribut user_seller
 * Ce script récupère toutes les ventes existantes et ajoute l'attribut user_seller
 * basé sur le fullName de l'utilisateur vendeur
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { DATABASE_ID, PROJECT_ID, ENDPOINT, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// IDs des collections
const SALES_COLLECTION_ID = COLLECTIONS.SALES;
const USERS_COLLECTION_ID = COLLECTIONS.USERS;

// Fonction pour générer user_seller à partir du fullName
function generateUserSeller(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return 'UNKNOWN'
  }

  // Nettoyer le nom : supprimer les accents, espaces multiples, caractères spéciaux
  const cleanName = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-zA-Z0-9\s]/g, '') // Garder seulement lettres, chiffres et espaces
    .replace(/\s+/g, ' ') // Remplacer espaces multiples par un seul
    .trim()
    .toUpperCase()

  if (!cleanName) {
    return 'UNKNOWN'
  }

  // Stratégies de génération selon la longueur et le format du nom
  const words = cleanName.split(' ').filter(word => word.length > 0)
  
  if (words.length === 0) {
    return 'UNKNOWN'
  }
  
  // Si un seul mot
  if (words.length === 1) {
    return words[0].substring(0, 9)
  }
  
  // Si deux mots (prénom + nom)
  if (words.length === 2) {
    const [firstName, lastName] = words
    
    // Essayer prénom complet + initiale du nom
    if (firstName.length + 1 <= 9) {
      const result = firstName + lastName.charAt(0)
      if (result.length <= 9) {
        return result
      }
    }
    
    // Essayer initiale prénom + nom complet
    if (lastName.length + 1 <= 9) {
      const result = firstName.charAt(0) + lastName
      if (result.length <= 9) {
        return result
      }
    }
    
    // Essayer les 4 premiers caractères de chaque mot
    const result = firstName.substring(0, 4) + lastName.substring(0, 4)
    if (result.length <= 9) {
      return result
    }
    
    // Fallback : tronquer à 9 caractères
    return (firstName + lastName).substring(0, 9)
  }
  
  // Si trois mots ou plus (prénom + nom(s) de famille)
  if (words.length >= 3) {
    const firstName = words[0]
    const lastNames = words.slice(1)
    
    // Essayer prénom + initiales des noms de famille
    const initials = lastNames.map(name => name.charAt(0)).join('')
    if (firstName.length + initials.length <= 9) {
      return firstName + initials
    }
    
    // Essayer initiale prénom + premier nom de famille
    const result = firstName.charAt(0) + lastNames[0]
    if (result.length <= 9) {
      return result
    }
    
    // Fallback : concaténer tous les mots et tronquer
    return words.join('').substring(0, 9)
  }
  
  // Fallback final
  return cleanName.replace(/\s/g, '').substring(0, 9)
}



// Fonction pour récupérer toutes les ventes
async function getAllSales() {
  try {
    console.log('📥 Récupération de toutes les ventes...')
    
    const response = await databases.listDocuments(DATABASE_ID, SALES_COLLECTION_ID)
    
    console.log(`✅ ${response.documents.length} ventes récupérées`)
    return response.documents
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des ventes:', error.message)
    throw error
  }
}

// Fonction pour récupérer un utilisateur par son ID
async function getUserById(userId) {
  try {
    const response = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
    return response;
  } catch (error) {
    if (error.code === 404) {
      return null; // Utilisateur non trouvé
    }
    console.error('Erreur lors de la récupération de l\'utilisateur:', error.message);
    throw error;
  }
}

// Fonction pour mettre à jour une vente avec user_seller
async function updateSaleWithUserSeller(saleId, userSeller) {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      SALES_COLLECTION_ID,
      saleId,
      {
        user_seller: userSeller
      }
    );
    return response;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la vente:', error.message);
    throw error;
  }
}

// Fonction principale
async function updateExistingSalesWithUserSeller() {
  try {
    console.log('🚀 Début de la mise à jour des ventes existantes avec user_seller')
    console.log('📋 Configuration:')
    console.log(`   - Endpoint: ${ENDPOINT}`)
    console.log(`   - Project ID: ${PROJECT_ID}`)
    console.log(`   - Database ID: ${DATABASE_ID}`)
    console.log(`   - Sales Collection ID: ${SALES_COLLECTION_ID}`)
    console.log(`   - Users Collection ID: ${USERS_COLLECTION_ID}`)
    console.log('')

    // Récupérer toutes les ventes
    const sales = await getAllSales()
    
    if (sales.length === 0) {
      console.log('ℹ️  Aucune vente trouvée')
      return
    }

    console.log(`📊 Traitement de ${sales.length} ventes...`)
    console.log('')

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    // Traiter chaque vente
    for (let i = 0; i < sales.length; i++) {
      const sale = sales[i]
      const progress = `[${i + 1}/${sales.length}]`
      
      try {
        // Vérifier si user_seller existe déjà
        if (sale.user_seller) {
          console.log(`${progress} ⏭️  Vente ${sale.$id.substring(0, 8)} - user_seller déjà défini: ${sale.user_seller}`)
          skippedCount++
          continue
        }

        // Récupérer l'ID du vendeur (userId ou sellerId)
        const sellerId = sale.userId || sale.sellerId
        
        if (!sellerId) {
          console.log(`${progress} ⚠️  Vente ${sale.$id.substring(0, 8)} - Aucun vendeur défini`)
          // Mettre à jour avec 'UNKNOWN'
          await updateSaleWithUserSeller(sale.$id, 'UNKNOWN')
          updatedCount++
          continue
        }

        // Récupérer les informations du vendeur
        const user = await getUserById(sellerId)
        
        if (!user) {
          console.log(`${progress} ⚠️  Vente ${sale.$id.substring(0, 8)} - Vendeur ${sellerId.substring(0, 8)} non trouvé`)
          // Mettre à jour avec 'UNKNOWN'
          await updateSaleWithUserSeller(sale.$id, 'UNKNOWN')
          updatedCount++
          continue
        }

        // Générer user_seller
        const userSeller = generateUserSeller(user.fullName)
        
        // Mettre à jour la vente
        await updateSaleWithUserSeller(sale.$id, userSeller)
        
        console.log(`${progress} ✅ Vente ${sale.$id.substring(0, 8)} - Vendeur: ${user.fullName} → user_seller: ${userSeller}`)
        updatedCount++
        
        // Petite pause pour éviter de surcharger l'API
        if (i % 10 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (error) {
        console.error(`${progress} ❌ Erreur lors du traitement de la vente ${sale.$id.substring(0, 8)}:`, error.message)
        errorCount++
      }
    }

    console.log('')
    console.log('📈 Résumé de la mise à jour:')
    console.log(`   - Ventes mises à jour: ${updatedCount}`)
    console.log(`   - Ventes ignorées (déjà à jour): ${skippedCount}`)
    console.log(`   - Erreurs: ${errorCount}`)
    console.log(`   - Total traité: ${updatedCount + skippedCount + errorCount}/${sales.length}`)
    
    if (errorCount === 0) {
      console.log('🎉 Mise à jour terminée avec succès!')
    } else {
      console.log('⚠️  Mise à jour terminée avec des erreurs')
    }
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error.message)
    process.exit(1)
  }
}

// Vérification des variables d'environnement
if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ Variable d\'environnement APPWRITE_API_KEY manquante. Veuillez vérifier votre fichier .env.local')
  process.exit(1)
}

// Exécuter le script
if (require.main === module) {
  updateExistingSalesWithUserSeller()
    .then(() => {
      console.log('\n✨ Script terminé')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Échec du script:', error.message)
      process.exit(1)
    })
}

module.exports = {
  updateExistingSalesWithUserSeller,
  generateUserSeller
}

