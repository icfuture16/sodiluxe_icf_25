/**
 * Script pour vérifier l'état de la session Appwrite
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Account } = require('node-appwrite');

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);

async function checkSession() {
  console.log('=== Vérification de la session Appwrite ===');
  console.log(`Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);
  console.log(`Project ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);
  console.log(`Hostname: ${process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME}`);
  console.log('-------------------------------------------');
  
  try {
    // Vérifier si une session est active
    console.log('\nTentative de récupération de la session actuelle...');
    
    try {
      const session = await account.get();
      console.log('✅ Session active détectée!');
      console.log(`ID utilisateur: ${session.$id}`);
      console.log(`Email: ${session.email}`);
      console.log(`Nom: ${session.name}`);
    } catch (error) {
      console.log('❌ Aucune session active détectée.');
      console.log(`Message d'erreur: ${error.message}`);
      console.log(`Code d'erreur: ${error.code}`);
      
      // Tenter de créer une session anonyme
      console.log('\nTentative de création d\'une session anonyme...');
      try {
        const anonymousSession = await account.createAnonymousSession();
        console.log('✅ Session anonyme créée avec succès!');
        console.log(`ID de session: ${anonymousSession.$id}`);
      } catch (anonError) {
        console.log('❌ Échec de la création d\'une session anonyme.');
        console.log(`Message d'erreur: ${anonError.message}`);
        console.log(`Code d'erreur: ${anonError.code}`);
      }
    }
    
    // Vérifier les cookies
    console.log('\nVérification des cookies de session...');
    console.log('Note: Cette vérification est limitée en environnement Node.js.');
    console.log('Pour une vérification complète, utilisez l\'inspecteur du navigateur.');
    
    // Recommandations
    console.log('\n=== Recommandations ===');
    console.log('1. Vérifiez que vous êtes connecté à l\'application avant d\'effectuer des opérations.');
    console.log('2. Assurez-vous que les plateformes sont correctement configurées dans la console Appwrite:');
    console.log(`   - ${process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME}`);
    console.log('   - http://localhost:3000');
    console.log('3. Vérifiez les erreurs dans la console du navigateur lors des opérations.');
    console.log('4. Si le problème persiste, essayez de:');
    console.log('   - Vider le cache du navigateur');
    console.log('   - Utiliser une fenêtre de navigation privée');
    console.log('   - Redémarrer le serveur de développement');
    
  } catch (error) {
    console.error('Erreur lors de la vérification de la session:', error);
  }
}

checkSession();

