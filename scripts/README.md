# Scripts Utilitaires pour CRM Sodiluxe

## Script de synchronisation de la documentation

Ce script permet de synchroniser les fichiers de documentation des modules entre les dossiers `docs/modules` et `documentation/modules` pour assurer la cohérence de la documentation.

### Exécution du script

```bash
npm run sync-docs
```

### Comportement

- Le script vérifie les fichiers dans les deux dossiers
- Il copie les fichiers plus récents d'un dossier à l'autre
- Il affiche un rapport des fichiers synchronisés

## Script de création des collections Appwrite

Ce script permet de créer automatiquement toutes les collections Appwrite nécessaires pour le CRM Sodiluxe, basées sur les types définis dans `appwrite.types.ts`.

### Prérequis

1. Node.js installé sur votre machine
2. Clé API Appwrite avec les permissions suffisantes
3. Variables d'environnement configurées

### Configuration

Assurez-vous d'avoir un fichier `.env` à la racine du projet avec les variables suivantes :

```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1 (ou votre endpoint personnalisé)
NEXT_PUBLIC_APPWRITE_PROJECT_ID=votre_project_id
APPWRITE_API_KEY=votre_clé_api
```

### Installation des dépendances

```bash
npm install node-appwrite dotenv
```

### Exécution du script

```bash
node scripts/create-appwrite-collections.js
```

### Collections créées

Le script crée les collections suivantes dans la base de données `crm_sodiluxe` :

1. **stores** - Magasins
2. **users** - Utilisateurs
3. **clients** - Clients
4. **products** - Produits
5. **sales** - Ventes
6. **sale_items** - Articles de vente

Chaque collection est créée avec les attributs appropriés, les index nécessaires et les permissions de base.

### Comportement

- Si la base de données n'existe pas, elle sera créée automatiquement
- Si une collection existe déjà, elle ne sera pas modifiée
- Les erreurs sont affichées dans la console

### Personnalisation

Si vous souhaitez modifier la structure des collections, vous pouvez éditer les fonctions correspondantes dans le script.