/**
 * Script pour tester la génération du user_seller
 */

const { Client, Databases, Users } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { DATABASE_ID, PROJECT_ID, ENDPOINT, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);

// Fonction pour générer user_seller (copie de la fonction du projet)
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
    
    // Sinon, prendre les premières lettres
    return (firstName.substring(0, 4) + lastName.substring(0, 4)).substring(0, 9)
  }
  
  // Si plus de deux mots, prendre les initiales
  const initials = words.map(word => word.charAt(0)).join('')
  if (initials.length <= 9) {
    return initials
  }
  
  // Si trop d'initiales, prendre les 9 premières
  return initials.substring(0, 9)
}

async function testUserSeller(userId) {
  try {
    console.log(`🔍 Test de génération user_seller pour l'utilisateur: ${userId}`);
    
    // Essayer de récupérer depuis USERS
    let userSeller = 'UNKNOWN'
    console.log(`[DEBUG] Tentative de récupération du vendeur avec ID: ${userId}`);
    
    if (userId) {
      try {
        // Essayer d'abord avec l'API Users d'Appwrite
        const user = await users.get(userId);
        
        console.log(`[DEBUG] Vendeur récupéré via API Users:`, { id: user.$id, name: user.name, email: user.email });
        
        if (user.name && user.name.trim() !== '') {
          userSeller = generateUserSeller(user.name);
          console.log(`[DEBUG] user_seller généré: '${userSeller}' pour '${user.name}'`);
        } else {
          console.warn(`[WARNING] name vide ou invalide pour le vendeur ${userId}:`, user.name);
          userSeller = 'NO_NAME';
        }
      } catch (userError) {
        console.error(`[ERROR] Impossible de récupérer le vendeur via API Users ${userId}:`, userError.message);
        
        // Essayer avec la collection database comme fallback
        try {
          console.log(`[DEBUG] Tentative de récupération depuis collection USERS pour ${userId}`);
          const dbUser = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            userId
          );
          
          console.log(`[DEBUG] Vendeur récupéré via DB:`, { id: dbUser.$id, fullName: dbUser.fullName, email: dbUser.email });
          
          if (dbUser.fullName && dbUser.fullName.trim() !== '') {
            userSeller = generateUserSeller(dbUser.fullName);
            console.log(`[DEBUG] user_seller généré depuis DB: '${userSeller}' pour '${dbUser.fullName}'`);
          } else {
            console.warn(`[WARNING] fullName vide dans DB pour ${userId}`);
            userSeller = 'NO_DB_NAME';
          }
        } catch (dbError) {
          console.error(`[ERROR] Impossible de récupérer depuis DB pour ${userId}:`, dbError.message);
          userSeller = 'ERROR';
        }
      }
    } else {
      console.error(`[ERROR] Aucun userId fourni`);
    }
    
    console.log(`\n✅ Résultat final: user_seller = '${userSeller}'`);
    return userSeller;
    
  } catch (error) {
    console.error(`❌ Erreur lors du test:`, error.message);
  }
}

// Récupérer l'ID utilisateur depuis les arguments de ligne de commande
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Veuillez fournir un ID utilisateur');
  console.log('Usage: node test-user-seller.js <user-id>');
  process.exit(1);
}

testUserSeller(userId);