const { Client, Databases, Query } = require('node-appwrite');
const path = require('path');
const fs = require('fs');

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

// Fonction pour générer user_seller à partir du nom complet
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

async function fixAdminUserSeller() {
    console.log('🔧 Correction des ventes avec user_seller = "ADMIN"...');
    
    try {
        // 1. Rechercher toutes les ventes avec user_seller = 'ADMIN' ou userId = 'ADMIN'
        console.log('\n🔍 Recherche des ventes avec user_seller = "ADMIN"...');
        const salesWithAdminUserSeller = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.SALES,
            [
                Query.equal('user_seller', 'ADMIN')
            ]
        );
        
        console.log('\n🔍 Recherche des ventes avec userId = "ADMIN"...');
        const salesWithAdminUserId = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.SALES,
            [
                Query.equal('userId', 'ADMIN')
            ]
        );
        
        // Combiner les résultats en évitant les doublons
        const allProblematicSales = new Map();
        
        salesWithAdminUserSeller.documents.forEach(sale => {
            allProblematicSales.set(sale.$id, sale);
        });
        
        salesWithAdminUserId.documents.forEach(sale => {
            allProblematicSales.set(sale.$id, sale);
        });
        
        const problematicSales = Array.from(allProblematicSales.values());
        
        console.log(`Trouvé ${problematicSales.length} vente(s) à corriger`);
        console.log(`  - Ventes avec user_seller = 'ADMIN': ${salesWithAdminUserSeller.documents.length}`);
        console.log(`  - Ventes avec userId = 'ADMIN': ${salesWithAdminUserId.documents.length}`);
        
        if (problematicSales.length === 0) {
            console.log('✅ Aucune vente à corriger');
            return;
        }
        
        // 2. Récupérer les informations des utilisateurs
        console.log('\n👥 Récupération des informations des utilisateurs...');
        const users = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.USERS
        );
        
        const userMap = new Map();
        users.documents.forEach(user => {
            userMap.set(user.$id, user);
        });
        
        console.log(`Utilisateurs disponibles: ${users.documents.length}`);
        
        // 3. Corriger chaque vente
        let correctedCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        for (const sale of problematicSales) {
            try {
                const userId = sale.userId;
                
                // Cas spécial : si userId est 'ADMIN', on ne peut pas corriger automatiquement
                if (userId === 'ADMIN') {
                    console.log(`\n⚠️  Vente ${sale.$id} avec userId = 'ADMIN' - correction manuelle requise`);
                    console.log(`   Cette vente doit être assignée manuellement à un utilisateur valide`);
                    skippedCount++;
                    continue;
                }
                
                const user = userMap.get(userId);
                
                if (user) {
                    // Générer le bon user_seller à partir du nom complet
                    const correctUserSeller = generateUserSeller(user.fullName || user.name || user.email, userId);
                    
                    console.log(`\n🔄 Correction de la vente ${sale.$id}:`);
                    console.log(`   Utilisateur: ${user.fullName || user.name || user.email} (${userId})`);
                    console.log(`   Ancien user_seller: ${sale.user_seller}`);
                    console.log(`   Nouveau user_seller: ${correctUserSeller}`);
                    
                    // Vérifier si une correction est nécessaire
                    if (sale.user_seller === correctUserSeller) {
                        console.log(`   ℹ️  Aucune correction nécessaire`);
                        continue;
                    }
                    
                    // Mettre à jour la vente
                    await databases.updateDocument(
                        DATABASE_ID,
                        COLLECTIONS.SALES,
                        sale.$id,
                        {
                            user_seller: correctUserSeller
                        }
                    );
                    
                    correctedCount++;
                    console.log(`   ✅ Vente corrigée`);
                } else {
                    console.log(`\n❌ Utilisateur non trouvé pour la vente ${sale.$id} (userId: ${userId})`);
                    errorCount++;
                }
            } catch (error) {
                console.error(`❌ Erreur lors de la correction de la vente ${sale.$id}:`, error.message);
                errorCount++;
            }
        }
        
        // 4. Résumé
        console.log('\n📊 RÉSUMÉ DE LA CORRECTION:');
        console.log('========================================');
        console.log(`Total des ventes trouvées: ${problematicSales.length}`);
        console.log(`Ventes corrigées: ${correctedCount}`);
        console.log(`Ventes nécessitant une correction manuelle: ${skippedCount}`);
        console.log(`Erreurs: ${errorCount}`);
        
        if (skippedCount > 0) {
            console.log('\n⚠️  ATTENTION:');
            console.log(`${skippedCount} vente(s) ont userId = 'ADMIN' et nécessitent une correction manuelle.`);
            console.log('Ces ventes doivent être assignées à un utilisateur valide dans l\'interface d\'administration.');
        }
        
        if (correctedCount > 0) {
            console.log('\n✅ Correction terminée avec succès!');
            console.log('\n🔍 Vérification recommandée:');
            console.log('   Relancez le script de diagnostic pour confirmer que toutes les ventes ont été corrigées.');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error);
        throw error;
    }
}

// Exécuter le script
if (require.main === module) {
    fixAdminUserSeller()
        .then(() => {
            console.log('\n🎉 Script terminé');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = { fixAdminUserSeller, generateUserSeller };