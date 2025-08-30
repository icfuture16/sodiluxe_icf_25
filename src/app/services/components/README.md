# Structure du module SAV

Ce dossier contient les composants du module SAV, divisés en plusieurs fichiers pour une meilleure maintenabilité.

## Composants

- `SavOverview.tsx` : Tableau de bord du SAV avec statistiques et dernières demandes
- `NewSavRequest.tsx` : Formulaire de création d'une nouvelle demande SAV
- `PendingSavRequests.tsx` : Liste des demandes SAV en cours
- `CompletedSavRequests.tsx` : Liste des demandes SAV terminées
- `SavDetails.tsx` : Détails d'une demande SAV spécifique
- `types.ts` : Types et interfaces partagés entre les composants

## Utilisation

Ces composants sont importés et utilisés dans le composant principal `ServicesClient.tsx`.
