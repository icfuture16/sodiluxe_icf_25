const { Client, Databases, Query } = require('node-appwrite');
const path = require('path');
const readline = require('readline');

// Charger les variables d'environnement
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const config = require('./appwrite-config');
const { ENDPOINT, PROJECT_ID, DATABASE_ID, COLLECTIONS } = config;

// Configuration Appwrite
const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Interface pour les questions interactives
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

function generateUserSeller(fullName, userId) {
    if (!fullName) return 'UNKNOWN';
    
    // Cas spécial pour 'Admin' - utiliser l'ID utilisateur
    if (fullName.toLowerCase() === 'admin') {
        return `USER_${userId.substring(0, 6).toUpperCase()}`;
    }
    
    // Nettoyer et normaliser le nom
    const cleanName = fullName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Supprimer les caractères spéciaux
        .trim();
    
    // Diviser en mots et prendre les premières lettres
    const words = cleanName.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) return 'UNKNOWN';
    
    // Générer l'identifiant (max 9 caractères)
    let userSeller = '';
    
    if (words.length === 1) {
        // Un seul mot : prendre les 9 premiers caractères
        userSeller = words[0].substring(0, 9);
    } else {
        // Plusieurs mots : première lettre de chaque mot + reste du premier mot
        const initials = words.map(word => word[0]).join('');
        const remainingLength = 9 - initials.length;
        
        if (remainingLength > 0) {
            const firstWordRemainder = words[0].substring(1, 1 + remainingLength);
            userSeller = initials + firstWordRemainder;
        } else {
            userSeller = initials.substring(0, 9);
        }
    }
    
    return userSeller.toUpperCase();
}

async function fixRemainingAdminSales() {
    console.log('🔧 Correction manuelle des ventes restantes avec userId = "ADMIN"...');
    
    try {
        // 1. Récupérer les ventes avec userId = 'ADMIN'
        console.log('\n🔍 Recherche des ventes avec userId = "ADMIN"...');
        const salesWithAdminUserId = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.SALES,
            [
                Query.equal('userId', 'ADMIN')
            ]
        );
        
        if (salesWithAdminUserId.documents.length === 0) {
            console.log('✅ Aucune vente avec userId = "ADMIN" trouvée');
            rl.close();
            return;
        }
        
        console.log(`Trouvé ${salesWithAdminUserId.documents.length} vente(s) à corriger manuellement`);
        
        // 2. Récupérer les utilisateurs disponibles
        console.log('\n👥 Récupération des utilisateurs disponibles...');
        const users = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.USERS
        );
        
        console.log('\n📊 Utilisateurs disponibles:');
        users.documents.forEach((user, index) => {
            console.log(`${index + 1}. ${user.fullName || user.name || user.email} (ID: ${user.$id})`);
        });
        
        // 3. Traiter chaque vente manuellement
        for (const sale of salesWithAdminUserId.documents) {
            console.log('\n' + '='.repeat(80));
            console.log(`🔄 Vente à corriger: ${sale.$id}`);
            console.log(`Date: ${sale.$createdAt}`);
            console.log(`Magasin: ${sale.store || 'N/A'}`);
            console.log(`Montant: ${sale.total || 'N/A'}`);
            console.log(`userId actuel: ${sale.userId}`);
            console.log(`user_seller actuel: ${sale.user_seller}`);
            
            // Demander à l'utilisateur de choisir
            const choice = await askQuestion('\nChoisissez une action:\n1. Assigner à un utilisateur existant\n2. Supprimer cette vente\n3. Ignorer (laisser tel quel)\nVotre choix (1/2/3): ');
            
            if (choice === '1') {
                // Assigner à un utilisateur
                const userChoice = await askQuestion(`\nChoisissez l'utilisateur (1-${users.documents.length}): `);
                const userIndex = parseInt(userChoice) - 1;
                
                if (userIndex >= 0 && userIndex < users.documents.length) {
                    const selectedUser = users.documents[userIndex];
                    const newUserSeller = generateUserSeller(selectedUser.fullName || selectedUser.name || selectedUser.email, selectedUser.$id);
                    
                    console.log(`\n✏️  Assignation à: ${selectedUser.fullName || selectedUser.name || selectedUser.email}`);
                    console.log(`Nouveau userId: ${selectedUser.$id}`);
                    console.log(`Nouveau user_seller: ${newUserSeller}`);
                    
                    const confirm = await askQuestion('Confirmer cette assignation ? (o/n): ');
                    
                    if (confirm.toLowerCase() === 'o' || confirm.toLowerCase() === 'oui') {
                        await databases.updateDocument(
                            DATABASE_ID,
                            COLLECTIONS.SALES,
                            sale.$id,
                            {
                                userId: selectedUser.$id,
                                user_seller: newUserSeller
                            }
                        );
                        console.log('✅ Vente mise à jour avec succès');
                    } else {
                        console.log('❌ Assignation annulée');
                    }
                } else {
                    console.log('❌ Choix d\'utilisateur invalide');
                }
            } else if (choice === '2') {
                // Supprimer la vente
                const confirm = await askQuestion('⚠️  Êtes-vous sûr de vouloir supprimer cette vente ? (o/n): ');
                
                if (confirm.toLowerCase() === 'o' || confirm.toLowerCase() === 'oui') {
                    await databases.deleteDocument(
                        DATABASE_ID,
                        COLLECTIONS.SALES,
                        sale.$id
                    );
                    console.log('🗑️  Vente supprimée avec succès');
                } else {
                    console.log('❌ Suppression annulée');
                }
            } else if (choice === '3') {
                console.log('⏭️  Vente ignorée');
            } else {
                console.log('❌ Choix invalide, vente ignorée');
            }
        }
        
        console.log('\n🎉 Correction manuelle terminée');
        
    } catch (error) {
        console.error('❌ Erreur lors de la correction manuelle:', error);
        throw error;
    } finally {
        rl.close();
    }
}

// Exécuter le script
if (require.main === module) {
    fixRemainingAdminSales()
        .then(() => {
            console.log('\n✅ Script terminé');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = { fixRemainingAdminSales };