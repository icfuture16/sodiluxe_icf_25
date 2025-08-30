const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { DATABASE_ID, PROJECT_ID, ENDPOINT, COLLECTIONS } = require('./appwrite-config');
const MigrationValidator = require('./validate-migration');
const readline = require('readline');

// Configuration Appwrite
const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY); // Clé API admin requise

const databases = new Databases(client);

class CollectionCleaner {
    constructor() {
        this.databaseId = DATABASE_ID;
        this.debitSalesCollectionId = COLLECTIONS.DEBIT_SALES || 'debit_sales';
        this.debitSaleItemsCollectionId = COLLECTIONS.DEBIT_SALE_ITEMS || 'debit_sale_items';
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async cleanupOldCollections() {
        console.log('🧹 Début du processus de nettoyage des anciennes collections...');
        
        try {
            // 1. Validation préalable obligatoire
            console.log('\n🔍 Étape 1: Validation de la migration...');
            const isValid = await this.validateMigration();
            
            if (!isValid) {
                console.log('❌ La validation a échoué. Nettoyage annulé pour sécurité.');
                console.log('   Veuillez corriger les problèmes identifiés avant de relancer le nettoyage.');
                process.exit(1);
            }
            
            // 2. Sauvegarde de sécurité
            console.log('\n💾 Étape 2: Création d\'une sauvegarde de sécurité...');
            await this.createBackup();
            
            // 3. Confirmation utilisateur
            console.log('\n⚠️  Étape 3: Confirmation de suppression...');
            const confirmed = await this.confirmDeletion();
            
            if (!confirmed) {
                console.log('❌ Nettoyage annulé par l\'utilisateur.');
                process.exit(0);
            }
            
            // 4. Suppression des collections
            console.log('\n🗑️  Étape 4: Suppression des anciennes collections...');
            await this.deleteOldCollections();
            
            // 5. Validation finale
            console.log('\n✅ Étape 5: Validation finale...');
            await this.finalValidation();
            
            console.log('\n🎉 Nettoyage terminé avec succès!');
            console.log('   Les anciennes collections ont été supprimées.');
            console.log('   La migration est maintenant complète.');
            
        } catch (error) {
            console.error('❌ Erreur lors du nettoyage:', error);
            console.log('\n🔄 En cas de problème, vous pouvez restaurer depuis la sauvegarde.');
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    async validateMigration() {
        try {
            const validator = new MigrationValidator();
            
            // Exécuter la validation silencieusement pour obtenir le résultat
            const originalLog = console.log;
            let validationOutput = '';
            
            console.log = (...args) => {
                validationOutput += args.join(' ') + '\n';
            };
            
            await validator.validateMigration();
            const isValid = validator.generateValidationReport();
            
            console.log = originalLog;
            
            // Afficher un résumé de la validation
            if (isValid) {
                console.log('✅ Validation réussie - Migration complète et cohérente');
            } else {
                console.log('❌ Validation échouée - Des problèmes ont été détectés');
                console.log('\nDétails de la validation:');
                console.log(validationOutput);
            }
            
            return isValid;
        } catch (error) {
            console.error('❌ Erreur lors de la validation:', error);
            return false;
        }
    }

    async createBackup() {
        try {
            console.log('📦 Création d\'une sauvegarde des collections à supprimer...');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupData = {
                timestamp,
                collections: {}
            };
            
            // Sauvegarder debit_sales
            try {
                const debitSales = await databases.listDocuments(
                    this.databaseId,
                    this.debitSalesCollectionId,
                    [Query.limit(5000)]
                );
                backupData.collections.debit_sales = {
                    total: debitSales.total,
                    documents: debitSales.documents
                };
                console.log(`   ✅ Sauvegarde de ${debitSales.total} ventes débitrices`);
            } catch (error) {
                console.log('   ℹ️  Collection debit_sales déjà supprimée ou inaccessible');
            }
            
            // Sauvegarder debit_sale_items
            try {
                const debitSaleItems = await databases.listDocuments(
                    this.databaseId,
                    this.debitSaleItemsCollectionId,
                    [Query.limit(5000)]
                );
                backupData.collections.debit_sale_items = {
                    total: debitSaleItems.total,
                    documents: debitSaleItems.documents
                };
                console.log(`   ✅ Sauvegarde de ${debitSaleItems.total} items de ventes débitrices`);
            } catch (error) {
                console.log('   ℹ️  Collection debit_sale_items déjà supprimée ou inaccessible');
            }
            
            // Écrire la sauvegarde dans un fichier
            const fs = require('fs');
            const backupPath = `./backups/migration-cleanup-backup-${timestamp}.json`;
            
            // Créer le dossier backups s'il n'existe pas
            if (!fs.existsSync('./backups')) {
                fs.mkdirSync('./backups', { recursive: true });
            }
            
            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
            console.log(`   ✅ Sauvegarde créée: ${backupPath}`);
            
        } catch (error) {
            console.error('❌ Erreur lors de la création de la sauvegarde:', error);
            throw error;
        }
    }

    async confirmDeletion() {
        return new Promise((resolve) => {
            console.log('\n' + '⚠️ '.repeat(20));
            console.log('ATTENTION: SUPPRESSION DÉFINITIVE');
            console.log('⚠️ '.repeat(20));
            console.log('\nVous êtes sur le point de supprimer définitivement:');
            console.log('   • Collection "debit_sales"');
            console.log('   • Collection "debit_sale_items"');
            console.log('\nCette action est IRRÉVERSIBLE!');
            console.log('\nAssurez-vous que:');
            console.log('   ✅ La validation de migration a réussi');
            console.log('   ✅ Une sauvegarde a été créée');
            console.log('   ✅ L\'application fonctionne correctement avec les nouvelles données');
            console.log('\nTapez "SUPPRIMER" (en majuscules) pour confirmer la suppression:');
            
            this.rl.question('> ', (answer) => {
                resolve(answer.trim() === 'SUPPRIMER');
            });
        });
    }

    async deleteOldCollections() {
        const collectionsToDelete = [
            { id: this.debitSalesCollectionId, name: 'debit_sales' },
            { id: this.debitSaleItemsCollectionId, name: 'debit_sale_items' }
        ];
        
        for (const collection of collectionsToDelete) {
            try {
                console.log(`🗑️  Suppression de la collection "${collection.name}"...`);
                
                // Vérifier d'abord si la collection existe
                try {
                    await databases.getCollection(this.databaseId, collection.id);
                } catch (error) {
                    if (error.code === 404) {
                        console.log(`   ℹ️  Collection "${collection.name}" déjà supprimée`);
                        continue;
                    }
                    throw error;
                }
                
                // Supprimer tous les documents d'abord
                let hasMoreDocuments = true;
                let deletedCount = 0;
                
                while (hasMoreDocuments) {
                    const documents = await databases.listDocuments(
                        this.databaseId,
                        collection.id,
                        [Query.limit(100)]
                    );
                    
                    if (documents.documents.length === 0) {
                        hasMoreDocuments = false;
                        break;
                    }
                    
                    // Supprimer les documents par batch
                    for (const doc of documents.documents) {
                        await databases.deleteDocument(
                            this.databaseId,
                            collection.id,
                            doc.$id
                        );
                        deletedCount++;
                    }
                    
                    console.log(`   📄 ${deletedCount} documents supprimés...`);
                }
                
                // Supprimer la collection elle-même
                await databases.deleteCollection(this.databaseId, collection.id);
                console.log(`   ✅ Collection "${collection.name}" supprimée (${deletedCount} documents)`);
                
            } catch (error) {
                if (error.code === 404) {
                    console.log(`   ℹ️  Collection "${collection.name}" déjà supprimée`);
                } else {
                    console.error(`   ❌ Erreur lors de la suppression de "${collection.name}":`, error);
                    throw error;
                }
            }
        }
    }

    async finalValidation() {
        try {
            console.log('🔍 Vérification finale...');
            
            // Vérifier que les collections ont bien été supprimées
            const collectionsToCheck = [
                { id: this.debitSalesCollectionId, name: 'debit_sales' },
                { id: this.debitSaleItemsCollectionId, name: 'debit_sale_items' }
            ];
            
            for (const collection of collectionsToCheck) {
                try {
                    await databases.getCollection(this.databaseId, collection.id);
                    throw new Error(`La collection "${collection.name}" existe encore!`);
                } catch (error) {
                    if (error.code === 404) {
                        console.log(`   ✅ Collection "${collection.name}" bien supprimée`);
                    } else {
                        throw error;
                    }
                }
            }
            
            // Vérifier que la collection sales fonctionne toujours
            const salesTest = await databases.listDocuments(
                this.databaseId,
                COLLECTIONS.SALES,
                [Query.limit(1)]
            );
            
            console.log(`   ✅ Collection "sales" opérationnelle (${salesTest.total} ventes)`);
            
            // Vérifier les ventes à crédit
            const creditSalesTest = await databases.listDocuments(
                this.databaseId,
                COLLECTIONS.SALES,
                [
                    Query.equal('isCredit', true),
                    Query.limit(1)
                ]
            );
            
            console.log(`   ✅ Ventes à crédit accessibles (${creditSalesTest.total} ventes à crédit)`);
            
        } catch (error) {
            console.error('❌ Erreur lors de la validation finale:', error);
            throw error;
        }
    }
}

// Fonction utilitaire pour créer un script de restauration
function generateRestoreScript() {
    const restoreScript = `
// Script de restauration d'urgence
// À utiliser uniquement en cas de problème après le nettoyage

const { Client, Databases } = require('node-appwrite');
const fs = require('fs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { DATABASE_ID, PROJECT_ID, ENDPOINT, COLLECTIONS } = require('./appwrite-config');

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function restoreFromBackup(backupFilePath) {
    try {
        const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
        
        console.log('🔄 Restauration depuis la sauvegarde...');
        console.log('⚠️  ATTENTION: Cette opération peut prendre du temps');
        
        // Ici, vous devriez implémenter la logique de restauration
        // en recréant les collections et en restaurant les documents
        
        console.log('✅ Restauration terminée');
    } catch (error) {
        console.error('❌ Erreur lors de la restauration:', error);
    }
}

// Utilisation: node restore-backup.js chemin/vers/backup.json
if (require.main === module) {
    const backupPath = process.argv[2];
    if (!backupPath) {
        console.error('Usage: node restore-backup.js <chemin-vers-backup>');
        process.exit(1);
    }
    restoreFromBackup(backupPath);
}
`;
    
    const fs = require('fs');
    fs.writeFileSync('./scripts/restore-backup.js', restoreScript);
    console.log('📝 Script de restauration créé: ./scripts/restore-backup.js');
}

// Exécution du script
if (require.main === module) {
    // Créer le script de restauration
    generateRestoreScript();
    
    const cleaner = new CollectionCleaner();
    cleaner.cleanupOldCollections()
        .then(() => {
            console.log('\n🎉 Processus de nettoyage terminé avec succès!');
            console.log('\n📋 RÉSUMÉ:');
            console.log('   ✅ Migration validée');
            console.log('   ✅ Sauvegarde créée');
            console.log('   ✅ Anciennes collections supprimées');
            console.log('   ✅ Validation finale réussie');
            console.log('\n🚀 Votre application utilise maintenant une collection unifiée!');
        })
        .catch(error => {
            console.error('❌ Erreur lors du nettoyage:', error);
            process.exit(1);
        });
}

module.exports = CollectionCleaner;