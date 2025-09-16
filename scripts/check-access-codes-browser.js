// Script pour vérifier la collection access_codes depuis un environnement navigateur
// Ce script doit être exécuté dans un environnement Node.js mais simule la configuration du navigateur

// Définir manuellement les variables d'environnement qui seraient normalement disponibles dans Next.js
process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = '68bf1c29001d20f7444d';

// Importer les dépendances
const { Client, Databases, ID, Query } = require('appwrite');

// Initialiser le client Appwrite comme dans client.ts
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Initialiser le service Databases
const databases = new Databases(client);

// Définir les constantes
const DATABASE_ID = '68bf1e7b003c6b340d6e';
const ACCESS_CODES_COLLECTION = 'access_codes';

async function checkAccessCodesAsGuest() {
    console.log('Vérification de l\'accès à la collection access_codes en tant qu\'invité...');
    
    try {
        // Tenter de lister les documents de la collection access_codes
        const response = await databases.listDocuments(
            DATABASE_ID,
            ACCESS_CODES_COLLECTION
        );
        
        console.log('✅ Accès réussi à la collection access_codes en tant qu\'invité');
        console.log(`Nombre de documents: ${response.documents.length}`);
        
        if (response.documents.length > 0) {
            console.log('Codes disponibles:');
            response.documents.forEach(doc => {
                console.log(`- ${doc.code} (ID: ${doc.$id})`);
            });
        } else {
            console.log('⚠️ Aucun code d\'accès n\'est défini dans la collection.');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'accès à la collection access_codes:', error);
        
        if (error.code === 401) {
            console.log('Erreur d\'authentification: Les invités n\'ont pas la permission de lire la collection.');
            console.log('Solution: Exécutez le script configure-appwrite-permissions.js pour configurer les permissions');
        } else if (error.code === 404) {
            console.log('La collection access_codes n\'existe pas.');
            console.log('Solution: Exécutez le script create-appwrite-collections.js pour créer les collections');
        } else {
            console.log('Erreur inattendue. Vérifiez la configuration Appwrite et les permissions.');
        }
    }
}

// Fonction pour vérifier un code d'accès spécifique
async function verifyAccessCode(code) {
    console.log(`Vérification du code d'accès: ${code}`);
    
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            ACCESS_CODES_COLLECTION,
            [Query.equal('code', code)]
        );
        
        const isValid = response.documents.length > 0;
        
        if (isValid) {
            console.log('✅ Code d\'accès valide!');
        } else {
            console.log('❌ Code d\'accès invalide!');
        }
        
        return isValid;
    } catch (error) {
        console.error('❌ Erreur lors de la vérification du code d\'accès:', error);
        return false;
    }
}

// Exécuter les fonctions de vérification
async function runTests() {
    await checkAccessCodesAsGuest();
    
    // Tester avec un code d'accès de test
    console.log('\n--- Test de vérification d\'un code d\'accès ---');
    await verifyAccessCode('123456'); // Remplacer par un code que vous voulez tester
}

runTests();

