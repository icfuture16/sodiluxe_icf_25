/**
 * Script pour vérifier l'authentification client-side avec Appwrite
 * Ce script simule le comportement du client dans le navigateur
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Client, Account } = require('node-appwrite');

// Vérification des variables d'environnement requises
if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  console.error('Erreur: Variables d\'environnement manquantes.');
  console.error('Veuillez définir NEXT_PUBLIC_APPWRITE_ENDPOINT et NEXT_PUBLIC_APPWRITE_PROJECT_ID dans le fichier .env.local');
  process.exit(1);
}

// Configuration Appwrite (client-side, sans clé API)
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Ajouter l'en-tête Origin pour simuler le comportement du navigateur
if (process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME) {
  console.log(`Ajout de l'en-tête Origin: ${process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME}`);
  client.headers['Origin'] = process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME;
}

const account = new Account(client);

// Fonction principale
async function checkClientAuth() {
  try {
    console.log('Vérification de la connexion client à Appwrite...');
    console.log(`Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);
    console.log(`Project ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);
    
    // Tester une requête anonyme (qui ne nécessite pas d'authentification)
    try {
      console.log('\nTest de requête anonyme: Vérification du statut de la session...');
      const session = await account.getSession('current');
      console.log('✅ Requête réussie (session trouvée):', session);
    } catch (error) {
      if (error.code === 401) {
        console.log('✅ Requête anonyme réussie (aucune session active, ce qui est normal)');
      } else {
        console.error(`❌ Erreur lors de la requête anonyme:`, error);
        console.log('Code d\'erreur:', error.code);
        console.log('Type d\'erreur:', error.type);
        console.log('Message d\'erreur:', error.message);
        
        if (error.code === 400) {
          console.log('\n🔍 Analyse de l\'erreur 400:');
          console.log('Cette erreur peut être causée par:');
          console.log('1. Un problème de CORS - Vérifiez que votre domaine est bien configuré dans la console Appwrite');
          console.log('2. Un problème de configuration du client - Vérifiez les variables d\'environnement');
          console.log('3. Un problème de réseau - Vérifiez votre connexion Internet');
        }
      }
    }

    console.log('\n📋 Étapes de dépannage:');
    console.log('1. Vérifiez que les plateformes sont configurées dans la console Appwrite:');
    console.log(`   - ${process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME}`);
    console.log('2. Vérifiez que le PROJECT_ID est correct');
    console.log('3. Essayez de vider le cache du navigateur et les cookies');
    console.log('4. Vérifiez les erreurs dans la console du navigateur');
    
  } catch (error) {
    console.error('Erreur générale:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
checkClientAuth();