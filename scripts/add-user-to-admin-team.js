/**
 * Script pour ajouter un utilisateur à l'équipe 'admin' dans Appwrite
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Teams } = require('node-appwrite');
const config = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
  .setEndpoint(config.ENDPOINT)
  .setProject(config.PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const teams = new Teams(client);

async function addUserToAdminTeam() {
  try {
    console.log('🔍 Recherche de l\'équipe "admin"...');
    
    // Lister toutes les équipes
    const teamsList = await teams.list();
    const adminTeam = teamsList.teams.find(team => team.name === 'admin');
    
    if (!adminTeam) {
      console.error('❌ Équipe "admin" non trouvée!');
      console.log('💡 Exécutez d\'abord: node scripts/create-admin-team.js');
      process.exit(1);
    }
    
    console.log('✅ Équipe "admin" trouvée:', {
      id: adminTeam.$id,
      name: adminTeam.name
    });
    
    // Lister les membres actuels de l'équipe
    console.log('👥 Vérification des membres actuels...');
    const memberships = await teams.listMemberships(adminTeam.$id);
    console.log('📋 Membres actuels:', memberships.memberships.map(m => ({
      userId: m.userId,
      userEmail: m.userEmail,
      confirm: m.confirm,
      roles: m.roles
    })));
    
    // Vérifier si l'utilisateur admin est déjà membre
    const adminUserId = '6897a51f000609b185da'; // ID de l'utilisateur admin trouvé
    const adminEmail = 'admin@sodiluxe.com';
    
    const existingMembership = memberships.memberships.find(m => m.userId === adminUserId);
    
    if (existingMembership) {
      if (existingMembership.confirm) {
        console.log('✅ L\'utilisateur admin est déjà membre confirmé de l\'équipe.');
      } else {
        console.log('⏳ L\'utilisateur admin est membre mais pas encore confirmé.');
        console.log('💡 L\'utilisateur doit accepter l\'invitation dans son interface Appwrite.');
      }
    } else {
      console.log('➕ Ajout de l\'utilisateur admin à l\'équipe...');
      
      try {
        // Ajouter l'utilisateur à l'équipe admin avec des rôles
        const membership = await teams.createMembership(
          adminTeam.$id,
          ['admin'], // Rôles
          adminEmail // Email de l'utilisateur
        );
        
        console.log('✅ Invitation envoyée à l\'utilisateur admin!');
        console.log('📧 Membership créé:', {
          userId: membership.userId,
          userEmail: membership.userEmail,
          confirm: membership.confirm,
          roles: membership.roles
        });
        
        console.log('💡 L\'utilisateur doit maintenant accepter l\'invitation.');
      } catch (membershipError) {
        if (membershipError.code === 409) {
          console.log('⚠️  L\'utilisateur est peut-être déjà invité.');
        } else {
          throw membershipError;
        }
      }
    }
    
    // Afficher l'état final
    console.log('\n📊 État final de l\'équipe admin:');
    const finalMemberships = await teams.listMemberships(adminTeam.$id);
    finalMemberships.memberships.forEach(m => {
      console.log(`   - ${m.userEmail} (${m.userId})`);
      console.log(`     Confirmé: ${m.confirm ? '✅' : '❌'}`);
      console.log(`     Rôles: ${m.roles.join(', ') || 'Aucun'}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout à l\'équipe admin:', error);
    process.exit(1);
  }
}

// Vérifier les variables d'environnement
if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ Variable d\'environnement APPWRITE_API_KEY manquante.');
  process.exit(1);
}

console.log('🚀 Ajout de l\'utilisateur à l\'équipe admin...');
addUserToAdminTeam();

