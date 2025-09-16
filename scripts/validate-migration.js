const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { DATABASE_ID, PROJECT_ID, ENDPOINT, COLLECTIONS } = require('./appwrite-config');

// Configuration Appwrite
const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY); // Clé API admin requise

const databases = new Databases(client);

class MigrationValidator {
    constructor() {
        this.databaseId = DATABASE_ID;
        this.salesCollectionId = COLLECTIONS.SALES;
        this.debitSalesCollectionId = COLLECTIONS.DEBIT_SALES || 'debit_sales';
        this.saleItemsCollectionId = COLLECTIONS.SALE_ITEMS;
        this.debitSaleItemsCollectionId = COLLECTIONS.DEBIT_SALE_ITEMS || 'debit_sale_items';
        
        this.validationResults = {
            totalDebitSales: 0,
            migratedCreditSales: 0,
            missingUserSeller: [],
            dataIntegrityIssues: [],
            itemsMigrationStatus: {
                totalDebitItems: 0,
                migratedItems: 0
            }
        };
    }

    async validateMigration() {
        console.log('🔍 Début de la validation de la migration...');
        
        try {
            // 1. Vérifier le nombre total de ventes débitrices originales
            await this.countOriginalDebitSales();
            
            // 2. Vérifier les ventes à crédit migrées dans la collection sales
            await this.validateCreditSalesInSalesCollection();
            
            // 3. Vérifier la présence de user_seller dans toutes les ventes
            await this.validateUserSellerField();
            
            // 4. Vérifier la migration des items
            await this.validateItemsMigration();
            
            // 5. Vérifier l'intégrité des données
            await this.validateDataIntegrity();
            
            // 6. Générer le rapport final
            this.generateValidationReport();
            
        } catch (error) {
            console.error('❌ Erreur lors de la validation:', error);
            process.exit(1);
        }
    }

    async countOriginalDebitSales() {
        try {
            const debitSales = await databases.listDocuments(
                this.databaseId,
                this.debitSalesCollectionId,
                [Query.limit(5000)] // Ajuster selon le volume
            );
            
            this.validationResults.totalDebitSales = debitSales.total;
            console.log(`📊 Nombre total de ventes débitrices originales: ${debitSales.total}`);
        } catch (error) {
            console.log('ℹ️  Collection debit_sales introuvable (probablement déjà supprimée)');
            this.validationResults.totalDebitSales = 0;
        }
    }

    async validateCreditSalesInSalesCollection() {
        try {
            const creditSales = await databases.listDocuments(
                this.databaseId,
                this.salesCollectionId,
                [
                    Query.equal('isCredit', true),
                    Query.limit(5000)
                ]
            );
            
            this.validationResults.migratedCreditSales = creditSales.total;
            console.log(`📊 Nombre de ventes à crédit dans la collection sales: ${creditSales.total}`);
            
            // Vérifier quelques échantillons pour la structure des données
            if (creditSales.documents.length > 0) {
                const sample = creditSales.documents[0];
                const requiredCreditFields = [
                    'paidAmount', 'initialPayment', 'remainingAmount',
                    'guarantorName', 'guarantorContact', 'guarantorRelation'
                ];
                
                for (const field of requiredCreditFields) {
                    if (!(field in sample)) {
                        this.validationResults.dataIntegrityIssues.push(
                            `Champ manquant '${field}' dans les ventes à crédit`
                        );
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de la validation des ventes à crédit:', error);
            this.validationResults.dataIntegrityIssues.push('Impossible de valider les ventes à crédit');
        }
    }

    async validateUserSellerField() {
        try {
            // Vérifier toutes les ventes (normales et à crédit)
            const allSales = await databases.listDocuments(
                this.databaseId,
                this.salesCollectionId,
                [Query.limit(5000)]
            );
            
            console.log(`📊 Vérification du champ user_seller sur ${allSales.total} ventes...`);
            
            for (const sale of allSales.documents) {
                if (!sale.user_seller || sale.user_seller.trim() === '') {
                    this.validationResults.missingUserSeller.push({
                        saleId: sale.$id,
                        isCredit: sale.isCredit || false,
                        saleDate: sale.saleDate
                    });
                }
            }
            
            if (this.validationResults.missingUserSeller.length === 0) {
                console.log('✅ Toutes les ventes ont un user_seller valide');
            } else {
                console.log(`⚠️  ${this.validationResults.missingUserSeller.length} ventes sans user_seller`);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la validation du champ user_seller:', error);
            this.validationResults.dataIntegrityIssues.push('Impossible de valider le champ user_seller');
        }
    }

    async validateItemsMigration() {
        try {
            // Compter les items de ventes débitrices originaux
            try {
                const debitItems = await databases.listDocuments(
                    this.databaseId,
                    this.debitSaleItemsCollectionId,
                    [Query.limit(5000)]
                );
                this.validationResults.itemsMigrationStatus.totalDebitItems = debitItems.total;
            } catch (error) {
                console.log('ℹ️  Collection debit_sale_items introuvable');
            }
            
            // Compter les items migrés dans sale_items
            const migratedItems = await databases.listDocuments(
                this.databaseId,
                this.saleItemsCollectionId,
                [
                    Query.limit(5000)
                    // Note: On pourrait ajouter un filtre si on avait un champ pour identifier les items migrés
                ]
            );
            
            this.validationResults.itemsMigrationStatus.migratedItems = migratedItems.total;
            console.log(`📊 Items de ventes débitrices: ${this.validationResults.itemsMigrationStatus.totalDebitItems}`);
            console.log(`📊 Total items dans sale_items: ${this.validationResults.itemsMigrationStatus.migratedItems}`);
        } catch (error) {
            console.error('❌ Erreur lors de la validation des items:', error);
            this.validationResults.dataIntegrityIssues.push('Impossible de valider la migration des items');
        }
    }

    async validateDataIntegrity() {
        try {
            // Vérifier que les montants sont cohérents pour les ventes à crédit
            const creditSales = await databases.listDocuments(
                this.databaseId,
                this.salesCollectionId,
                [
                    Query.equal('isCredit', true),
                    Query.limit(100) // Échantillon pour validation
                ]
            );
            
            for (const sale of creditSales.documents) {
                // Vérifier la cohérence des montants
                const totalAmount = parseFloat(sale.totalAmount || 0);
                const paidAmount = parseFloat(sale.paidAmount || 0);
                const remainingAmount = parseFloat(sale.remainingAmount || 0);
                
                if (Math.abs((paidAmount + remainingAmount) - totalAmount) > 0.01) {
                    this.validationResults.dataIntegrityIssues.push(
                        `Incohérence des montants pour la vente ${sale.$id}: total=${totalAmount}, payé=${paidAmount}, restant=${remainingAmount}`
                    );
                }
                
                // Vérifier les champs obligatoires pour les ventes à crédit
                if (!sale.guarantorName || !sale.guarantorContact) {
                    this.validationResults.dataIntegrityIssues.push(
                        `Informations du garant manquantes pour la vente à crédit ${sale.$id}`
                    );
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de la validation de l\'intégrité:', error);
            this.validationResults.dataIntegrityIssues.push('Impossible de valider l\'intégrité des données');
        }
    }

    generateValidationReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 RAPPORT DE VALIDATION DE LA MIGRATION');
        console.log('='.repeat(60));
        
        console.log('\n📊 STATISTIQUES:');
        console.log(`   • Ventes débitrices originales: ${this.validationResults.totalDebitSales}`);
        console.log(`   • Ventes à crédit migrées: ${this.validationResults.migratedCreditSales}`);
        console.log(`   • Items débiteurs originaux: ${this.validationResults.itemsMigrationStatus.totalDebitItems}`);
        console.log(`   • Total items actuels: ${this.validationResults.itemsMigrationStatus.migratedItems}`);
        
        console.log('\n🔍 VALIDATION USER_SELLER:');
        if (this.validationResults.missingUserSeller.length === 0) {
            console.log('   ✅ Toutes les ventes ont un user_seller valide');
        } else {
            console.log(`   ⚠️  ${this.validationResults.missingUserSeller.length} ventes sans user_seller:`);
            this.validationResults.missingUserSeller.slice(0, 5).forEach(sale => {
                console.log(`      - ${sale.saleId} (${sale.isCredit ? 'crédit' : 'normale'}) - ${sale.saleDate}`);
            });
            if (this.validationResults.missingUserSeller.length > 5) {
                console.log(`      ... et ${this.validationResults.missingUserSeller.length - 5} autres`);
            }
        }
        
        console.log('\n🔧 INTÉGRITÉ DES DONNÉES:');
        if (this.validationResults.dataIntegrityIssues.length === 0) {
            console.log('   ✅ Aucun problème d\'intégrité détecté');
        } else {
            console.log(`   ⚠️  ${this.validationResults.dataIntegrityIssues.length} problèmes détectés:`);
            this.validationResults.dataIntegrityIssues.forEach(issue => {
                console.log(`      - ${issue}`);
            });
        }
        
        console.log('\n🎯 RECOMMANDATIONS:');
        
        // Vérifier si la migration semble complète
        const migrationComplete = 
            this.validationResults.totalDebitSales === this.validationResults.migratedCreditSales &&
            this.validationResults.missingUserSeller.length === 0 &&
            this.validationResults.dataIntegrityIssues.length === 0;
        
        if (migrationComplete) {
            console.log('   ✅ La migration semble complète et réussie');
            console.log('   ✅ Vous pouvez procéder au nettoyage des anciennes collections');
            console.log('   ✅ Commande: node scripts/cleanup-old-collections.js');
        } else {
            console.log('   ⚠️  La migration nécessite des corrections avant le nettoyage:');
            
            if (this.validationResults.totalDebitSales !== this.validationResults.migratedCreditSales) {
                console.log('      - Vérifier que toutes les ventes débitrices ont été migrées');
            }
            
            if (this.validationResults.missingUserSeller.length > 0) {
                console.log('      - Corriger les ventes sans user_seller');
            }
            
            if (this.validationResults.dataIntegrityIssues.length > 0) {
                console.log('      - Résoudre les problèmes d\'intégrité des données');
            }
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Retourner le statut pour utilisation programmatique
        return migrationComplete;
    }
}

// Exécution du script
if (require.main === module) {
    const validator = new MigrationValidator();
    validator.validateMigration()
        .then(() => {
            console.log('\n✅ Validation terminée');
        })
        .catch(error => {
            console.error('❌ Erreur lors de la validation:', error);
            process.exit(1);
        });
}

module.exports = MigrationValidator;

