/**
 * Script pour créer l'utilisateur avec un ID unique et tester le user_seller
 */

const { Client, Databases, Users, ID } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { DATABASE_ID, PROJECT_ID, ENDPOINT, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);

async function createUserWithUniqueId(authUserId) {
  try {
    console.log(`🔍 Récupération de l'utilisateur ${authUserId} depuis l'authentification...`);
    
    // Récupérer l'utilisateur depuis l'authentification
    const authUser = await users.get(authUserId);
    console.log('✅ Utilisateur trouvé dans l\'authentification:');
    console.log(`  ID: ${authUser.$id}`);
    console.log(`  Nom: ${authUser.name}`);
    console.log(`  Email: ${authUser.email}`);
    
    // Fonction pour générer le user_seller (version JS de sellerUtils.ts)
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
        return words[0].substring(0, 15)
      }
      
      // Si deux mots (prénom + nom)
      if (words.length === 2) {
        const [firstName, lastName] = words
        
        // Essayer prénom complet + initiale du nom
        if (firstName.length + 1 <= 15) {
          const result = firstName + lastName.charAt(0)
          if (result.length <= 15) {
            return result
          }
        }
        
        // Essayer initiale prénom + nom complet
        if (lastName.length + 1 <= 15) {
          const result = firstName.charAt(0) + lastName
          if (result.length <= 15) {
            return result
          }
        }
        
        // Essayer les 7 premiers caractères de chaque mot
        const result = firstName.substring(0, 7) + lastName.substring(0, 7)
        if (result.length <= 15) {
          return result
        }
        
        // Fallback : tronquer à 15 caractères
        return (firstName + lastName).substring(0, 15)
      }
      
      // Si trois mots ou plus (prénom + nom(s) de famille)
      if (words.length >= 3) {
        const firstName = words[0]
        const lastNames = words.slice(1)
        
        // Essayer prénom + initiales des noms de famille
        const initials = lastNames.map(name => name.charAt(0)).join('')
        if (firstName.length + initials.length <= 15) {
          return firstName + initials
        }
        
        // Essayer initiale prénom + premier nom de famille
        const result = firstName.charAt(0) + lastNames[0]
        if (result.length <= 15) {
          return result
        }
        
        // Fallback : concaténer tous les mots et tronquer
        return words.join('').substring(0, 15)
      }
      
      // Fallback final
      return cleanName.replace(/\s/g, '').substring(0, 15)
    }
    
    const userSeller = generateUserSeller(authUser.name);
    console.log(`\n🏷️  user_seller généré: "${userSeller}" (${userSeller.length} caractères)`);
    
    // Créer l'utilisateur dans la collection users avec un ID unique
    const uniqueId = ID.unique();
    console.log(`📝 Création de l'utilisateur avec l'ID unique: ${uniqueId}`);
    
    const newUserDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      uniqueId,
      {
        fullName: authUser.name,
        email: authUser.email,
        role: 'seller',
        storeId: '686af0b20011ff9382c8', // Store par défaut
        user_seller: userSeller // Ajouter le user_seller généré
      }
    );
    
    console.log('\n✅ Utilisateur créé avec succès dans la collection users:');
    console.log(`  ID: ${newUserDoc.$id}`);
    console.log(`  Full Name: ${newUserDoc.fullName}`);
    console.log(`  Email: ${newUserDoc.email}`);
    console.log(`  Role: ${newUserDoc.role}`);
    console.log(`  Store ID: ${newUserDoc.storeId}`);
    console.log(`  User Seller: ${newUserDoc.user_seller}`);
    
    console.log('\n🎉 Utilisateur créé avec succès!');
    console.log(`\n💡 Note: L'ID d'authentification est ${authUserId}`);
    console.log(`💡 Note: L'ID dans la collection users est ${newUserDoc.$id}`);
    console.log('💡 Pour que l\'application trouve cet utilisateur, il faudra soit:');
    console.log('   1. Modifier la logique pour chercher par email');
    console.log('   2. Ou créer un mapping entre les IDs');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
  }
}

// Utiliser l'ID de l'utilisateur manquant
const missingUserId = '688987f7003216df6426';
createUserWithUniqueId(missingUserId);

