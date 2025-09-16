/**
 * Script de diagnostic pour identifier les ventes avec 'ADMIN' comme sellerId/userId
 * et proposer des solutions pour corriger ces données problématiques
 */

const { Client, Databases, Query } = require('node-appwrite');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const config = require('./appwrite-config');
const { ENDPOINT, PROJECT_ID, DATABASE_ID, COLLECTIONS } = config;

// Configuration Appwrite
const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const SALES_COLLECTION_ID = COLLECTIONS.SALES;
const USERS_COLLECTION_ID = COLLECTIONS.USERS;

async function diagnoseSales() {
    console.log('🔍 Diagnostic des ventes avec ADMIN comme sellerId/userId...');
    
    let salesWithAdminUserId = { documents: [] };
    let salesWithAdminSellerId = { documents: [] };
    let salesWithAdminUserSeller = { documents: [] };
    
    try {
        // 1. Rechercher toutes les ventes avec 'ADMIN' comme userId
        console.log('\n🔍 Recherche des ventes avec userId = "ADMIN"...');
        try {
            salesWithAdminUserId = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.SALES,
                [
                    Query.equal('userId', 'ADMIN')
                ]
            );
            
            if (salesWithAdminUserId.documents.length > 0) {
                console.log(`❌ Trouvé ${salesWithAdminUserId.documents.length} vente(s) avec userId = "ADMIN"`);
            } else {
                console.log('✅ Aucune vente trouvée avec userId = "ADMIN"');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la recherche par userId:', error.message);
        }
        
        // 2. Rechercher toutes les ventes avec 'ADMIN' comme sellerId (champ optionnel)
        console.log('\n🔍 Recherche des ventes avec sellerId = "ADMIN"...');
        try {
            salesWithAdminSellerId = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.SALES,
                [
                    Query.equal('sellerId', 'ADMIN')
                ]
            );
            
            if (salesWithAdminSellerId.documents.length > 0) {
                console.log(`❌ Trouvé ${salesWithAdminSellerId.documents.length} vente(s) avec sellerId = "ADMIN"`);
            } else {
                console.log('✅ Aucune vente trouvée avec sellerId = "ADMIN"');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la recherche par sellerId:', error.message);
        }
        
        // 3. Rechercher toutes les ventes avec 'ADMIN' comme user_seller
        console.log('\n🔍 Recherche des ventes avec user_seller = "ADMIN"...');
        try {
            salesWithAdminUserSeller = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.SALES,
                [
                    Query.equal('user_seller', 'ADMIN')
                ]
            );
            
            if (salesWithAdminUserSeller.documents.length > 0) {
                console.log(`❌ Trouvé ${salesWithAdminUserSeller.documents.length} vente(s) avec user_seller = "ADMIN"`);
            } else {
                console.log('✅ Aucune vente trouvée avec user_seller = "ADMIN"');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la recherche par user_seller:', error.message);
        }
        
        // 4. Combiner tous les résultats
        const allProblematicSales = [
            ...salesWithAdminUserId.documents.map(sale => ({ ...sale, issue: 'userId = ADMIN' })),
            ...salesWithAdminSellerId.documents.map(sale => ({ ...sale, issue: 'sellerId = ADMIN' })),
            ...salesWithAdminUserSeller.documents.map(sale => ({ ...sale, issue: 'user_seller = ADMIN' }))
        ];
        
        // Supprimer les doublons basés sur l'ID
        const uniqueSales = allProblematicSales.filter((sale, index, self) => 
            index === self.findIndex(s => s.$id === sale.$id)
        );
        
        console.log(`\n🚨 Total des ventes problématiques uniques: ${uniqueSales.length}`);
        
        // 5. Analyser les détails de chaque vente problématique
        if (uniqueSales.length > 0) {
            console.log('\n📋 Détails des ventes problématiques:');
            console.log('=' .repeat(80));
            
            for (const sale of uniqueSales) {
                console.log(`\nID Vente: ${sale.$id}`);
                console.log(`Problème: ${sale.issue}`);
                console.log(`Date: ${sale.$createdAt}`);
                console.log(`Magasin: ${sale.store || 'N/A'}`);
                console.log(`Montant: ${sale.total || 'N/A'}`);
                console.log(`sellerId: ${sale.sellerId || 'N/A'}`);
                console.log(`userId: ${sale.userId || 'N/A'}`);
                console.log(`user_seller: ${sale.user_seller || 'N/A'}`);
                console.log('-'.repeat(40));
            }
        }
        
        // 6. Rechercher les utilisateurs existants pour proposer des corrections
        console.log('\n👥 Recherche des utilisateurs disponibles...');
        const users = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [
                Query.limit(100)
            ]
        );
        
        console.log(`\n📊 Utilisateurs disponibles (${users.documents.length}):`);
        users.documents.forEach(user => {
            console.log(`- ID: ${user.$id}, Nom: ${user.name || user.email || 'N/A'}, Email: ${user.email || 'N/A'}`);
        });
        
        // 7. Générer un rapport détaillé
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalProblematicSales: uniqueSales.length,
                salesWithAdminUserId: salesWithAdminUserId.documents.length,
                salesWithAdminSellerId: salesWithAdminSellerId.documents.length,
                salesWithAdminUserSeller: salesWithAdminUserSeller.documents.length
            },
            problematicSales: uniqueSales.map(sale => ({
                id: sale.$id,
                issue: sale.issue,
                createdAt: sale.$createdAt,
                store: sale.store,
                total: sale.total,
                sellerId: sale.sellerId,
                userId: sale.userId,
                user_seller: sale.user_seller
            })),
            availableUsers: users.documents.map(user => ({
                id: user.$id,
                name: user.name,
                email: user.email
            })),
            recommendations: [
                {
                    action: 'Identifier l\'utilisateur correct',
                    description: 'Examiner chaque vente pour déterminer qui était le vrai vendeur'
                },
                {
                    action: 'Mettre à jour les IDs',
                    description: 'Remplacer "ADMIN" par l\'ID utilisateur correct dans sellerId/userId'
                },
                {
                    action: 'Corriger user_seller',
                    description: 'Mettre à jour user_seller avec le nom complet du vendeur'
                },
                {
                    action: 'Ajouter une validation',
                    description: 'Implémenter une validation pour empêcher l\'utilisation d\'"ADMIN" comme ID utilisateur'
                }
            ]
        };
        
        // 8. Sauvegarder le rapport
        const reportPath = path.join(__dirname, 'admin-sales-diagnostic-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n💾 Rapport sauvegardé dans: ${reportPath}`);
        
        // 9. Afficher les recommandations
        console.log('\n🔧 RECOMMANDATIONS POUR CORRIGER:');
        console.log('=' .repeat(50));
        report.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec.action}`);
            console.log(`   ${rec.description}\n`);
        });
        
        // 10. Script de correction suggéré
        if (uniqueSales.length > 0) {
            console.log('\n📝 SCRIPT DE CORRECTION SUGGÉRÉ:');
            console.log('=' .repeat(40));
            console.log('// Pour chaque vente problématique, exécuter:');
            console.log('// await databases.updateDocument(');
            console.log('//     DATABASE_ID,');
            console.log('//     SALES_COLLECTION_ID,');
            console.log('//     "SALE_ID",');
            console.log('//     {');
            console.log('//         sellerId: "CORRECT_USER_ID",');
            console.log('//         userId: "CORRECT_USER_ID",');
            console.log('//         user_seller: "Nom Complet du Vendeur"');
            console.log('//     }');
            console.log('// );');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du diagnostic:', error.message);
        
        if (error.code === 401) {
            console.log('\n🔑 ERREUR D\'AUTHENTIFICATION:');
            console.log('- Vérifiez que votre Project ID est correct');
            console.log('- Assurez-vous d\'avoir configuré une API Key avec les bonnes permissions');
            console.log('- Vérifiez les variables d\'environnement APPWRITE_PROJECT_ID et APPWRITE_API_KEY');
        }
        
        if (error.code === 404) {
            console.log('\n🔍 RESSOURCE NON TROUVÉE:');
            console.log('- Vérifiez que les IDs de base de données et collections sont corrects');
            console.log('- Assurez-vous que les collections existent dans votre projet Appwrite');
        }
    }
}

// Exécuter le diagnostic
if (require.main === module) {
    diagnoseSales().catch(console.error);
}

module.exports = { diagnoseSales };

