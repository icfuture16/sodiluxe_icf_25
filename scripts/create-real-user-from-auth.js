const { Client, Databases, Users } = require('node-appwrite');
const config = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(config.ENDPOINT)
  .setProject(config.PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);
const DATABASE_ID = config.DATABASE_ID;
const USERS_COLLECTION_ID = config.COLLECTIONS.USERS;

// Fonction pour générer un user_seller (max 15 caractères)
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
    
    // Fallback : concaténer et tronquer
    return (firstName + lastName).substring(0, 15)
  }
  
  // Si plus de deux mots, prendre les initiales + premiers mots
  if (words.length >= 3) {
    const firstName = words[0]
    const lastNames = words.slice(1)
    
    // Essayer prénom + initiales des noms
    const initials = lastNames.map(word => word.charAt(0)).join('')
    if (firstName.length + initials.length <= 15) {
      return firstName + initials
    }
    
    // Fallback : prendre les initiales de tous les mots
    const allInitials = words.map(word => word.charAt(0)).join('')
    if (allInitials.length <= 15) {
      return allInitials
    }
    
    // Dernier fallback : tronquer à 15 caractères
    return words.join('').substring(0, 15)
  }
  
  return 'UNKNOWN'
}

async function createRealUserFromAuth() {
  const userId = '688987f7003216df6426';
  
  try {
    console.log('🔍 Récupération des informations de l\'utilisateur authentifié:', userId);
    
    // Vérifier si l'utilisateur existe déjà dans la collection users
    let existingUser = null;
    try {
      existingUser = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId
      );
      console.log('✅ L\'utilisateur existe déjà dans la collection users:', existingUser.fullName);
      console.log('📋 user_seller actuel:', existingUser.user_seller || 'Non défini');
      
      // Si user_seller n'est pas défini, on va le mettre à jour
      if (!existingUser.user_seller) {
        console.log('🔄 Mise à jour nécessaire pour ajouter user_seller...');
      } else {
        console.log('✅ user_seller déjà défini, aucune action nécessaire.');
        return;
      }
    } catch (error) {
      if (error.code !== 404) {
        throw error;
      }
      console.log('❌ Utilisateur non trouvé dans la collection users, récupération depuis l\'authentification...');
    }

    // Récupérer les informations de l'utilisateur depuis l'API Users
    let authUser;
    try {
      authUser = await users.get(userId);
      console.log('✅ Utilisateur trouvé dans l\'authentification:', {
        id: authUser.$id,
        name: authUser.name,
        email: authUser.email,
        status: authUser.status
      });
    } catch (authError) {
      console.error('❌ Impossible de récupérer l\'utilisateur depuis l\'authentification:', authError.message);
      
      // Si l'utilisateur existe dans la collection mais pas dans l'auth, utiliser les données existantes
      if (existingUser) {
        console.log('💡 Utilisation des données existantes de la collection...');
        authUser = {
          $id: userId,
          name: existingUser.fullName,
          email: existingUser.email,
          status: true
        };
      } else {
        console.log('💡 Création d\'un utilisateur avec des données par défaut...');
        authUser = {
          $id: userId,
          name: 'Utilisateur Inconnu',
          email: `user${userId.substring(0, 8)}@sodiluxe.com`,
          status: true
        };
      }
    }

    // Générer le user_seller
    const userSeller = generateUserSeller(authUser.name);
    console.log(`📝 user_seller généré: '${userSeller}' (${userSeller.length} caractères)`);

    let resultUser;
    
    if (existingUser) {
      // Mettre à jour l'utilisateur existant
      console.log('🔄 Mise à jour de l\'utilisateur existant...');
      
      const updateData = {
        user_seller: userSeller
      };
      
      // Mettre à jour aussi le fullName si on a de meilleures données depuis l'auth
      if (authUser.name !== existingUser.fullName && authUser.name !== 'Utilisateur Inconnu') {
        updateData.fullName = authUser.name;
        console.log(`📝 Mise à jour du nom: '${existingUser.fullName}' → '${authUser.name}'`);
      }
      
      resultUser = await databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId,
        updateData
      );
      
      console.log('✅ Utilisateur mis à jour avec succès!');
    } else {
      // Créer un nouvel utilisateur
      console.log('📝 Création d\'un nouvel utilisateur...');
      
      const userData = {
        email: authUser.email,
        fullName: authUser.name,
        role: 'seller',
        storeId: '6859971b0030b8c47c17', // ID du magasin par défaut
        user_seller: userSeller
      };

      resultUser = await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId, // Utiliser le même ID que l'authentification
        userData
      );
      
      console.log('✅ Utilisateur créé avec succès!');
    }

    console.log('📋 Détails finaux:', {
      id: resultUser.$id,
      fullName: resultUser.fullName,
      email: resultUser.email,
      role: resultUser.role,
      storeId: resultUser.storeId,
      user_seller: resultUser.user_seller
    });

    console.log('\n✅ Validation:');
    console.log(`   - user_seller: '${resultUser.user_seller}' (${resultUser.user_seller.length} caractères)`);
    console.log(`   - Conforme à la limite de 15 caractères: ${resultUser.user_seller.length <= 15 ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Erreur lors de la gestion de l\'utilisateur:', error.message);
    if (error.response) {
      console.error('📋 Détails de l\'erreur:', error.response);
    }
    process.exit(1);
  }
}

// Exécuter le script
createRealUserFromAuth();

