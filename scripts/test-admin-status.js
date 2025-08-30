/**
 * Script pour tester la logique de vérification du statut admin
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Teams, Account } = require('node-appwrite');
const config = require('./appwrite-config');

// Configuration Appwrite avec clé API (pour les tests côté serveur)
const serverClient = new Client()
  .setEndpoint(config.ENDPOINT)
  .setProject(config.PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

// Configuration Appwrite côté client (simulation)
const clientSideClient = new Client()
  .setEndpoint(config.ENDPOINT)
  .setProject(config.PROJECT_ID);

const serverTeams = new Teams(serverClient);
const clientTeams = new Teams(clientSideClient);
const account = new Account(clientSideClient);

async function testAdminStatusLogic() {
  try {
    console.log('🧪 Test de la logique de vérification du statut admin...');
    console.log('📡 Endpoint:', config.ENDPOINT);
    console.log('🆔 Project ID:', config.PROJECT_ID);
    
    // Test 1: Vérifier les équipes côté serveur (avec API key)
    console.log('\n🔍 Test 1: Vérification des équipes côté serveur...');
    const serverTeamsList = await serverTeams.list();
    console.log('📋 Équipes trouvées (serveur):', serverTeamsList.teams.map(t => ({ id: t.$id, name: t.name })));
    
    const adminTeam = serverTeamsList.teams.find(team => team.name === 'admin');
    if (adminTeam) {
      console.log('✅ Équipe admin trouvée:', { id: adminTeam.$id, name: adminTeam.name });
      
      const memberships = await serverTeams.listMemberships(adminTeam.$id);
      console.log('👥 Membres de l\'équipe admin:', memberships.memberships.map(m => ({
        userId: m.userId,
        userEmail: m.userEmail,
        confirm: m.confirm,
        roles: m.roles
      })));
    } else {
      console.log('❌ Équipe admin non trouvée côté serveur');
    }
    
    // Test 2: Simuler la logique côté client (sans API key)
    console.log('\n🔍 Test 2: Simulation de la logique côté client...');
    
    try {
      // Cette requête devrait échouer car côté client on n'a pas d'API key
      const clientTeamsList = await clientTeams.list();
      console.log('📋 Équipes trouvées (client):', clientTeamsList.teams.map(t => ({ id: t.$id, name: t.name })));
    } catch (clientError) {
      console.log('❌ Erreur côté client (attendue):', clientError.message);
      console.log('💡 Ceci explique pourquoi isAdmin retourne null côté client!');
      
      if (clientError.code === 401) {
        console.log('🔐 Erreur 401: Unauthorized - L\'API Teams nécessite une authentification serveur');
      }
    }
    
    // Test 3: Vérifier les permissions de l'API Teams
    console.log('\n🔍 Test 3: Analyse des permissions...');
    console.log('📝 Problème identifié:');
    console.log('   - L\'API Teams d\'Appwrite nécessite une clé API serveur');
    console.log('   - Le code côté client (AuthProvider) ne peut pas accéder aux équipes');
    console.log('   - Solution: Utiliser userProfile.role au lieu du système d\'équipes');
    
    // Test 4: Proposer une solution alternative
    console.log('\n💡 Solution recommandée:');
    console.log('   1. Modifier AuthProvider pour utiliser userProfile.role');
    console.log('   2. Créer un endpoint API pour vérifier le statut admin si nécessaire');
    console.log('   3. Ou utiliser les labels utilisateur d\'Appwrite');
    
    console.log('\n🎯 Prochaines étapes:');
    console.log('   - Modifier AuthProvider.tsx pour utiliser userProfile.role');
    console.log('   - Supprimer la logique checkAdminStatus basée sur les équipes');
    console.log('   - Tester avec un utilisateur ayant role="admin" dans sa collection users');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Vérifier les variables d'environnement
if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ Variable d\'environnement APPWRITE_API_KEY manquante.');
  process.exit(1);
}

console.log('🚀 Démarrage du test de diagnostic...');
testAdminStatusLogic();