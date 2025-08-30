/**
 * Script de correction pour réparer les ventes avec 'ADMIN' comme sellerId/userId
 * Utilise les résultats du diagnostic pour corriger automatiquement les données
 */

const { Client, Databases, Query } = require('node-appwrite');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const config = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
    .setEndpoint(config.ENDPOINT)
    .setProject(config.PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = config.DATABASE_ID;
const SALES_COLLECTION_ID = config.COLLECTIONS.SALES;
const USERS_COLLECTION_ID = config.COLLECTIONS.USERS;

// Interface pour les questions utilisateur
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function fixAdminSales() {
    console.log('🔧 Script de correction des ventes avec ADMIN comme sellerId/userId...');
    
    try {
        // 1. Charger le rapport de diagnostic s'il existe
        const reportPath = path.join(__dirname, 'admin-sales-diagnostic-report.json');
        let diagnosticReport = null;
        
        if (fs.existsSync(reportPath)) {
            console.log('📋 Chargement du rapport de diagnostic...');
            diagnosticReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            console.log(`Trouvé ${diagnosticReport.summary.totalProblematicSales} vente(s) problématique(s)`);
        } else {
            console.log('⚠️  Aucun rapport de diagnostic trouvé. Exécutez d\'abord diagnose-admin-sales.js');
            return;
        }
        
        if (diagnosticReport.summary.totalProblematicSales === 0) {
            console.log('✅ Aucune vente problématique à corriger!');
            return;
        }
        
        // 2. Récupérer les utilisateurs disponibles
        console.log('\n👥 Récupération des utilisateurs disponibles...');
        const users = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Query.limit(100)]
        );
        
        console.log('\n📊 Utilisateurs disponibles:');
        users.documents.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.$id} | Nom: ${user.name || 'N/A'} | Email: ${user.email || 'N/A'}`);
        });
        
        // 3. Options de correction
        console.log('\n🔧 OPTIONS DE CORRECTION:');
        console.log('1. Correction automatique (assigner à un utilisateur par défaut)');
        console.log('2. Correction manuelle (choisir pour chaque vente)');
        console.log('3. Supprimer les ventes problématiques');
        console.log('4. Annuler');
        
        const choice = await askQuestion('\nChoisissez une option (1-4): ');
        
        switch (choice) {
            case '1':
                await automaticFix(diagnosticReport, users.documents);
                break;
            case '2':
                await manualFix(diagnosticReport, users.documents);
                break;
            case '3':
                await deleteSales(diagnosticReport);
                break;
            case '4':
                console.log('❌ Opération annulée.');
                break;
            default:
                console.log('❌ Option invalide.');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error.message);
    } finally {
        rl.close();
    }
}

async function automaticFix(report, users) {
    console.log('\n🤖 CORRECTION AUTOMATIQUE');
    
    if (users.length === 0) {
        console.log('❌ Aucun utilisateur disponible pour la correction.');
        return;
    }
    
    // Choisir un utilisateur par défaut
    console.log('\nUtilisateurs disponibles:');
    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || user.email || user.$id}`);
    });
    
    const userChoice = await askQuestion('Choisissez l\'utilisateur par défaut (numéro): ');
    const selectedUser = users[parseInt(userChoice) - 1];
    
    if (!selectedUser) {
        console.log('❌ Utilisateur invalide.');
        return;
    }
    
    console.log(`\n✅ Utilisateur sélectionné: ${selectedUser.name || selectedUser.email} (${selectedUser.$id})`);
    
    const confirm = await askQuestion('Confirmer la correction automatique? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
        console.log('❌ Correction annulée.');
        return;
    }
    
    // Corriger toutes les ventes
    let corrected = 0;
    let errors = 0;
    
    for (const sale of report.problematicSales) {
        try {
            await databases.updateDocument(
                DATABASE_ID,
                SALES_COLLECTION_ID,
                sale.id,
                {
                    sellerId: selectedUser.$id,
                    userId: selectedUser.$id,
                    user_seller: selectedUser.name || selectedUser.email || 'Utilisateur Corrigé'
                }
            );
            
            console.log(`✅ Vente ${sale.id} corrigée`);
            corrected++;
        } catch (error) {
            console.log(`❌ Erreur pour la vente ${sale.id}: ${error.message}`);
            errors++;
        }
    }
    
    console.log(`\n📊 RÉSULTATS:`);
    console.log(`✅ Ventes corrigées: ${corrected}`);
    console.log(`❌ Erreurs: ${errors}`);
}

async function manualFix(report, users) {
    console.log('\n👤 CORRECTION MANUELLE');
    
    let corrected = 0;
    let skipped = 0;
    
    for (const sale of report.problematicSales) {
        console.log('\n' + '='.repeat(60));
        console.log(`VENTE: ${sale.id}`);
        console.log(`Problème: ${sale.issue}`);
        console.log(`Date: ${sale.createdAt}`);
        console.log(`Magasin: ${sale.store || 'N/A'}`);
        console.log(`Montant: ${sale.total || 'N/A'}`);
        console.log('='.repeat(60));
        
        console.log('\nUtilisateurs disponibles:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name || user.email || user.$id}`);
        });
        console.log('0. Ignorer cette vente');
        
        const choice = await askQuestion('Choisissez un utilisateur (0 pour ignorer): ');
        
        if (choice === '0') {
            console.log('⏭️  Vente ignorée');
            skipped++;
            continue;
        }
        
        const selectedUser = users[parseInt(choice) - 1];
        if (!selectedUser) {
            console.log('❌ Choix invalide, vente ignorée');
            skipped++;
            continue;
        }
        
        try {
            await databases.updateDocument(
                DATABASE_ID,
                SALES_COLLECTION_ID,
                sale.id,
                {
                    sellerId: selectedUser.$id,
                    userId: selectedUser.$id,
                    user_seller: selectedUser.name || selectedUser.email || 'Utilisateur Corrigé'
                }
            );
            
            console.log(`✅ Vente corrigée avec l'utilisateur: ${selectedUser.name || selectedUser.email}`);
            corrected++;
        } catch (error) {
            console.log(`❌ Erreur lors de la correction: ${error.message}`);
        }
    }
    
    console.log(`\n📊 RÉSULTATS:`);
    console.log(`✅ Ventes corrigées: ${corrected}`);
    console.log(`⏭️  Ventes ignorées: ${skipped}`);
}

async function deleteSales(report) {
    console.log('\n🗑️  SUPPRESSION DES VENTES PROBLÉMATIQUES');
    console.log(`⚠️  ATTENTION: Cette action supprimera définitivement ${report.summary.totalProblematicSales} vente(s)!`);
    
    const confirm1 = await askQuestion('Êtes-vous sûr de vouloir supprimer ces ventes? (y/N): ');
    if (confirm1.toLowerCase() !== 'y') {
        console.log('❌ Suppression annulée.');
        return;
    }
    
    const confirm2 = await askQuestion('Tapez "SUPPRIMER" pour confirmer: ');
    if (confirm2 !== 'SUPPRIMER') {
        console.log('❌ Suppression annulée.');
        return;
    }
    
    let deleted = 0;
    let errors = 0;
    
    for (const sale of report.problematicSales) {
        try {
            await databases.deleteDocument(
                DATABASE_ID,
                SALES_COLLECTION_ID,
                sale.id
            );
            
            console.log(`🗑️  Vente ${sale.id} supprimée`);
            deleted++;
        } catch (error) {
            console.log(`❌ Erreur pour la vente ${sale.id}: ${error.message}`);
            errors++;
        }
    }
    
    console.log(`\n📊 RÉSULTATS:`);
    console.log(`🗑️  Ventes supprimées: ${deleted}`);
    console.log(`❌ Erreurs: ${errors}`);
}

// Exécuter le script de correction
if (require.main === module) {
    fixAdminSales().catch(console.error);
}

module.exports = { fixAdminSales };