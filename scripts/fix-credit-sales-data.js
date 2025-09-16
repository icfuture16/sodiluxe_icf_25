const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { DATABASE_ID, PROJECT_ID, ENDPOINT, COLLECTIONS } = require('./appwrite-config');
const readline = require('readline');

// Configuration Appwrite
const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

class CreditSalesDataFixer {
    constructor() {
        this.databaseId = DATABASE_ID;
        this.salesCollectionId = COLLECTIONS.SALES;
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async fixCreditSalesData() {
        console.log('🔧 Correction des données des ventes à crédit...');
        
        try {
            // 1. Identifier les ventes à crédit avec des données manquantes
            const problematicSales = await this.findProblematicCreditSales();
            
            if (problematicSales.length === 0) {
                console.log('✅ Aucune vente à crédit ne nécessite de correction.');
                return;
            }
            
            console.log(`\n📋 ${problematicSales.length} ventes à crédit nécessitent des corrections:`);
            problematicSales.forEach((sale, index) => {
                console.log(`   ${index + 1}. Vente ${sale.$id} - ${sale.saleDate} - ${sale.totalAmount}€`);
                console.log(`      Problèmes: ${sale.issues.join(', ')}`);
            });
            
            // 2. Demander confirmation pour la correction automatique
            const autoFix = await this.askForAutoFix();
            
            if (autoFix) {
                await this.autoFixCreditSales(problematicSales);
            } else {
                await this.manualFixCreditSales(problematicSales);
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de la correction:', error);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    async findProblematicCreditSales() {
        try {
            const creditSales = await databases.listDocuments(
                this.databaseId,
                this.salesCollectionId,
                [
                    Query.equal('isCredit', true),
                    Query.limit(100)
                ]
            );
            
            const problematicSales = [];
            
            for (const sale of creditSales.documents) {
                const issues = [];
                

                
                // Vérifier la cohérence des montants
                const totalAmount = parseFloat(sale.totalAmount || 0);
                const paidAmount = parseFloat(sale.paidAmount || 0);
                const remainingAmount = parseFloat(sale.remainingAmount || 0);
                
                if (Math.abs((paidAmount + remainingAmount) - totalAmount) > 0.01) {
                    issues.push('Incohérence des montants');
                }
                
                // Vérifier les montants négatifs ou invalides
                if (totalAmount <= 0) {
                    issues.push('Montant total invalide');
                }
                
                if (paidAmount < 0) {
                    issues.push('Montant payé négatif');
                }
                
                if (remainingAmount < 0) {
                    issues.push('Montant restant négatif');
                }
                
                if (issues.length > 0) {
                    problematicSales.push({
                        ...sale,
                        issues
                    });
                }
            }
            
            return problematicSales;
        } catch (error) {
            console.error('❌ Erreur lors de la recherche des ventes problématiques:', error);
            throw error;
        }
    }

    async askForAutoFix() {
        return new Promise((resolve) => {
            console.log('\n🤖 Options de correction:');
            console.log('   1. Correction automatique (valeurs par défaut)');
            console.log('   2. Correction manuelle (saisie interactive)');
            console.log('\nLa correction automatique appliquera:');
            console.log('   • Correction des montants incohérents');
            
            this.rl.question('\nChoisissez (1 pour auto, 2 pour manuel): ', (answer) => {
                resolve(answer.trim() === '1');
            });
        });
    }

    async autoFixCreditSales(problematicSales) {
        console.log('\n🤖 Correction automatique en cours...');
        
        for (const sale of problematicSales) {
            try {
                const updates = {};
                

                
                // Corriger les montants si nécessaire
                const totalAmount = parseFloat(sale.totalAmount || 0);
                const paidAmount = parseFloat(sale.paidAmount || 0);
                let remainingAmount = parseFloat(sale.remainingAmount || 0);
                
                // Recalculer le montant restant si incohérent
                if (Math.abs((paidAmount + remainingAmount) - totalAmount) > 0.01) {
                    remainingAmount = totalAmount - paidAmount;
                    updates.remainingAmount = remainingAmount;
                    console.log(`   📊 Montant restant recalculé pour ${sale.$id}: ${remainingAmount}€`);
                }
                
                // Corriger les montants négatifs
                if (remainingAmount < 0) {
                    updates.remainingAmount = 0;
                    updates.paidAmount = totalAmount;
                    console.log(`   📊 Montants corrigés pour ${sale.$id}: payé=${totalAmount}€, restant=0€`);
                }
                
                // Appliquer les mises à jour
                if (Object.keys(updates).length > 0) {
                    await databases.updateDocument(
                        this.databaseId,
                        this.salesCollectionId,
                        sale.$id,
                        updates
                    );
                    
                    console.log(`   ✅ Vente ${sale.$id} corrigée`);
                }
                
            } catch (error) {
                console.error(`   ❌ Erreur lors de la correction de ${sale.$id}:`, error);
            }
        }
        
        console.log('\n✅ Correction automatique terminée!');
    }

    async manualFixCreditSales(problematicSales) {
        console.log('\n✏️  Correction manuelle...');
        
        for (const sale of problematicSales) {
            console.log(`\n📋 Correction de la vente ${sale.$id}:`);
            console.log(`   Date: ${sale.saleDate}`);
            console.log(`   Montant total: ${sale.totalAmount}€`);
            console.log(`   Problèmes: ${sale.issues.join(', ')}`);
            
            const updates = {};
            

            
            // Corriger les montants si nécessaire
            if (sale.issues.some(issue => issue.includes('montant'))) {
                console.log(`   Montants actuels: Total=${sale.totalAmount}€, Payé=${sale.paidAmount}€, Restant=${sale.remainingAmount}€`);
                
                const newPaidAmount = await this.askQuestion(`Montant payé (actuel: ${sale.paidAmount}€): `);
                if (newPaidAmount.trim() && !isNaN(parseFloat(newPaidAmount))) {
                    const paidAmount = parseFloat(newPaidAmount);
                    const totalAmount = parseFloat(sale.totalAmount);
                    updates.paidAmount = paidAmount;
                    updates.remainingAmount = totalAmount - paidAmount;
                }
            }
            
            // Appliquer les mises à jour
            if (Object.keys(updates).length > 0) {
                try {
                    await databases.updateDocument(
                        this.databaseId,
                        this.salesCollectionId,
                        sale.$id,
                        updates
                    );
                    console.log(`   ✅ Vente ${sale.$id} mise à jour`);
                } catch (error) {
                    console.error(`   ❌ Erreur lors de la mise à jour:`, error);
                }
            } else {
                console.log(`   ⏭️  Vente ${sale.$id} ignorée`);
            }
        }
        
        console.log('\n✅ Correction manuelle terminée!');
    }

    async askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }
}

// Exécution du script
if (require.main === module) {
    const fixer = new CreditSalesDataFixer();
    fixer.fixCreditSalesData()
        .then(() => {
            console.log('\n🎉 Correction des données terminée!');
            console.log('\n📋 PROCHAINES ÉTAPES:');
            console.log('   1. Relancer la validation: node scripts/validate-migration.js');
            console.log('   2. Si validation OK: node scripts/cleanup-old-collections.js');
        })
        .catch(error => {
            console.error('❌ Erreur lors de la correction:', error);
            process.exit(1);
        });
}

module.exports = CreditSalesDataFixer;

