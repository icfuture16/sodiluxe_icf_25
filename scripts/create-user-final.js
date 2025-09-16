/**
 * Script pour créer l'utilisateur avec un ID basé sur timestamp
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

async function createUserFinal(authUserId) {
  try {
    console.log(`🔍 Récupération de l'utilisateur ${authUserId} depuis l'authentification...`);
    
    // Récupérer l'utilisateur depuis l'authentification
    const authUser = await users.get(authUserId);
    console.log('✅ Utilisateur trouvé dans l\'authentification:');
    console.log(`  ID: ${authUser.$id}`);
    console.log(`  Nom: ${authUser.name}`);
    console.log(`  Email: ${authUser.email}`);
    
    // Fonction pour générer le user_seller
    function generateUserSeller(fullName) {
      if (!fullName || typeof fullName !== 'string') {
        return 'UNKNOWN'
      }
    
      const cleanName = fullName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase()
    
      if (!cleanName) {
        return 'UNKNOWN'
      }
    
      const words = cleanName.split(' ').filter(word => word.length > 0)
      
      if (words.length === 0) {
        return 'UNKNOWN'
      }
      
      if (words.length === 1) {
        return words[0].substring(0, 15)
      }
      
      if (words.length === 2) {
        const [firstName, lastName] = words
        
        if (firstName.length + 1 <= 15) {
          const result = firstName + lastName.charAt(0)
          if (result.length <= 15) {
            return result
          }
        }
        
        if (lastName.length + 1 <= 15) {
          const result = firstName.charAt(0) + lastName
          if (result.length <= 15) {
            return result
          }
        }
        
        const result = firstName.substring(0, 7) + lastName.substring(0, 7)
        if (result.length <= 15) {
          return result
        }
        
        return (firstName + lastName).substring(0, 15)
      }
      
      if (words.length >= 3) {
        const firstName = words[0]
        const lastNames = words.slice(1)
        
        const initials = lastNames.map(name => name.charAt(0)).join('')
        if (firstName.length + initials.length <= 15) {
          return firstName + initials
        }
        
        const result = firstName.charAt(0) + lastNames[0]
        if (result.length <= 15) {
          return result
        }
        
        return words.join('').substring(0, 15)
      }
      
      return cleanName.replace(/\s/g, '').substring(0, 15)
    }
    
    const userSeller = generateUserSeller(authUser.name);
    console.log(`\n🏷️  user_seller généré: "${userSeller}" (${userSeller.length} caractères)`);
    
    // Créer un ID unique basé sur timestamp
    const timestamp = Date.now().toString(36);
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueId = `user_${timestamp}_${randomSuffix}`;
    
    console.log(`📝 Création de l'utilisateur avec l'ID: ${uniqueId}`);
    
    const newUserDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      uniqueId,
      {
        fullName: authUser.name,
        email: authUser.email,
        role: 'seller',
        storeId: '686af0b20011ff9382c8',
        user_seller: userSeller
      }
    );
    
    console.log('\n✅ Utilisateur créé avec succès dans la collection users:');
    console.log(`  ID: ${newUserDoc.$id}`);
    console.log(`  Full Name: ${newUserDoc.fullName}`);
    console.log(`  Email: ${newUserDoc.email}`);
    console.log(`  Role: ${newUserDoc.role}`);
    console.log(`  Store ID: ${newUserDoc.storeId}`);
    console.log(`  User Seller: ${newUserDoc.user_seller}`);
    
    console.log('\n🎉 Succès! Le user_seller a été généré correctement:');
    console.log(`   - Nom complet: "${authUser.name}"`);
    console.log(`   - user_seller: "${userSeller}" (${userSeller.length} caractères)`);
    console.log(`   - Conforme à la limite de 15 caractères: ${userSeller.length <= 15 ? '✅' : '❌'}`);
    
    console.log('\n💡 Maintenant, pour que l\'application trouve cet utilisateur,');
    console.log('   il faut modifier la logique pour chercher par email au lieu de l\'ID d\'authentification.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
  }
}

// Utiliser l'ID de l'utilisateur manquant
const missingUserId = '688987f7003216df6426';
createUserFinal(missingUserId);

