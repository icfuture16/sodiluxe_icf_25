/**
 * Script pour créer l'équipe 'admin' dans Appwrite et y ajouter l'utilisateur administrateur
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Teams, Users } = require('node-appwrite');
const config = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(config.ENDPOINT)
  .setProject(config.PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const teams = new Teams(client);
const users = new Users(client);

async function createAdminTeam() {
  try {
    console.log('🔍 Vérification de l\'existence de l\'équipe "admin"...');
    
    // Lister toutes les équipes
    const teamsList = await teams.list();
    console.log('📋 Équipes existantes:', teamsList.teams.map(t => ({ id: t.$id, name: t.name })));
    
    // Chercher l'équipe 'admin'
    let adminTeam = teamsList.teams.find(team => team.name === 'admin');
    
    if (!adminTeam) {
      console.log('❌ Équipe "admin" non trouvée. Création en cours...');
      
      // Créer l'équipe 'admin'
      adminTeam = await teams.create(
        'admin-team-id', // ID unique pour l'équipe
        'admin' // Nom de l'équipe
      );
      
      console.log('✅ Équipe "admin" créée avec succès:', {
        id: adminTeam.$id,
        name: adminTeam.name
      });
    } else {
      console.log('✅ Équipe "admin" existe déjà:', {
        id: adminTeam.$id,
        name: adminTeam.name
      });
    }
    
    // Lister tous les utilisateurs pour trouver l'administrateur
    console.log('🔍 Recherche de l\'utilisateur administrateur...');
    const usersList = await users.list();
    console.log('👥 Utilisateurs trouvés:', usersList.users.length);
    
    // Chercher un utilisateur avec un email d'admin (vous pouvez ajuster ce critère)
    const adminUser = usersList.users.find(user => 
      user.email.includes('admin') || 
      user.email.includes('sodiluxe') ||
      user.name.toLowerCase().includes('admin')
    );
    
    if (!adminUser) {
      console.log('⚠️  Aucun utilisateur administrateur trouvé.');
      console.log('📝 Utilisateurs disponibles:');
      usersList.users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ID: ${user.$id}`);
      });
      
      // Demander à l'utilisateur de spécifier l'ID de l'admin
      console.log('\n💡 Pour ajouter un utilisateur à l\'équipe admin, utilisez:');
      console.log('   node scripts/add-user-to-admin-team.js <USER_ID>');
      return;
    }
    
    console.log('👤 Utilisateur administrateur trouvé:', {
      id: adminUser.$id,
      name: adminUser.name,
      email: adminUser.email
    });
    
    // Vérifier si l'utilisateur est déjà membre de l'équipe
    const memberships = await teams.listMemberships(adminTeam.$id);
    const isAlreadyMember = memberships.memberships.some(m => m.userId === adminUser.$id);
    
    if (isAlreadyMember) {
      console.log('✅ L\'utilisateur est déjà membre de l\'équipe admin.');
    } else {
      console.log('➕ Ajout de l\'utilisateur à l\'équipe admin...');
      
      // Ajouter l'utilisateur à l'équipe admin
      await teams.createMembership(
        adminTeam.$id,
        [],
        adminUser.email
      );
      
      console.log('✅ Utilisateur ajouté à l\'équipe admin avec succès!');
    }
    
    console.log('\n🎉 Configuration de l\'équipe admin terminée!');
    console.log('📋 Résumé:');
    console.log(`   - Équipe: ${adminTeam.name} (${adminTeam.$id})`);
    console.log(`   - Admin: ${adminUser.name} (${adminUser.email})`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'équipe admin:', error);
    
    if (error.code === 409) {
      console.log('💡 L\'équipe existe peut-être déjà avec un ID différent.');
    }
    
    process.exit(1);
  }
}

// Vérifier les variables d'environnement
if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ Variable d\'environnement APPWRITE_API_KEY manquante.');
  console.log('💡 Ajoutez votre clé API Appwrite dans le fichier .env.local');
  process.exit(1);
}

console.log('🚀 Démarrage du script de création de l\'équipe admin...');
console.log('📡 Endpoint:', config.ENDPOINT);
console.log('🆔 Project ID:', config.PROJECT_ID);
console.log('🔑 API Key:', process.env.APPWRITE_API_KEY ? '***' : 'Non définie');

createAdminTeam();