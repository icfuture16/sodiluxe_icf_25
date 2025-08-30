/**
 * Script pour mettre à jour le rôle de l'utilisateur admin dans la collection users
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Databases } = require('node-appwrite');
const config = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(config.ENDPOINT)
  .setProject(config.PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function updateAdminUserRole() {
  try {
    console.log('🔍 Recherche de l\'utilisateur admin dans la collection users...');
    
    const adminUserId = '6897a51f000609b185da'; // ID de l'utilisateur admin
    const adminEmail = 'admin@sodiluxe.com';
    
    // Vérifier si le profil utilisateur existe
    try {
      const userProfile = await databases.getDocument(
        config.DATABASE_ID,
        config.COLLECTIONS.USERS,
        adminUserId
      );
      
      console.log('✅ Profil utilisateur trouvé:', {
        id: userProfile.$id,
        email: userProfile.email,
        fullName: userProfile.fullName,
        role: userProfile.role,
        storeId: userProfile.storeId,
        user_seller: userProfile.user_seller
      });
      
      // Vérifier si le rôle est déjà admin
      if (userProfile.role === 'admin') {
        console.log('✅ L\'utilisateur a déjà le rôle admin!');
        return;
      }
      
      // Mettre à jour le rôle vers admin
      console.log('🔄 Mise à jour du rôle vers "admin"...');
      const updatedProfile = await databases.updateDocument(
        config.DATABASE_ID,
        config.COLLECTIONS.USERS,
        adminUserId,
        {
          role: 'admin'
        }
      );
      
      console.log('✅ Rôle mis à jour avec succès!');
      console.log('📋 Profil mis à jour:', {
        id: updatedProfile.$id,
        email: updatedProfile.email,
        fullName: updatedProfile.fullName,
        role: updatedProfile.role,
        storeId: updatedProfile.storeId,
        user_seller: updatedProfile.user_seller
      });
      
    } catch (profileError) {
      if (profileError.code === 404) {
        console.log('❌ Profil utilisateur non trouvé dans la collection users.');
        console.log('🔧 Création du profil utilisateur admin...');
        
        // Créer le profil utilisateur admin
        const newProfile = await databases.createDocument(
          config.DATABASE_ID,
          config.COLLECTIONS.USERS,
          adminUserId,
          {
            email: adminEmail,
            fullName: 'Admin Sodiluxe',
            role: 'admin',
            storeId: '', // Pas de magasin spécifique pour l'admin
            user_seller: 'ADMIN' // Identifiant vendeur pour l'admin
          }
        );
        
        console.log('✅ Profil utilisateur admin créé!');
        console.log('📋 Nouveau profil:', {
          id: newProfile.$id,
          email: newProfile.email,
          fullName: newProfile.fullName,
          role: newProfile.role,
          storeId: newProfile.storeId,
          user_seller: newProfile.user_seller
        });
      } else {
        throw profileError;
      }
    }
    
    console.log('\n🎉 Configuration terminée!');
    console.log('💡 L\'utilisateur admin devrait maintenant avoir isAdmin = true');
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du rôle admin:', error);
    process.exit(1);
  }
}

// Vérifier les variables d'environnement
if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ Variable d\'environnement APPWRITE_API_KEY manquante.');
  process.exit(1);
}

console.log('🚀 Mise à jour du rôle utilisateur admin...');
console.log('📡 Endpoint:', config.ENDPOINT);
console.log('🆔 Project ID:', config.PROJECT_ID);
console.log('🗄️ Database ID:', config.DATABASE_ID);
console.log('📁 Collection Users:', config.COLLECTIONS.USERS);

updateAdminUserRole();