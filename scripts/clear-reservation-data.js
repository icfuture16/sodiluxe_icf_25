const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

const DATABASE_ID = '68599714002eef233c16'; // Remplacez par l'ID de votre base de données
const RESERVATIONS_COLLECTION_ID = 'reservations'; // Remplacez par l'ID de votre collection de réservations
const RESERVATION_ITEMS_COLLECTION_ID = 'reservation_items'; // Remplacez par l'ID de votre collection d'articles de réservation

const client = new Client();

client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

async function clearCollection(collectionId) {
    console.log(`Suppression des documents de la collection : ${collectionId}`);
    let hasMore = true;
    let totalDeleted = 0;

    while (hasMore) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                collectionId,
                [Query.limit(100)] // Supprime par lots de 100
            );

            if (response.documents.length === 0) {
                hasMore = false;
                break;
            }

            for (const doc of response.documents) {
                await databases.deleteDocument(DATABASE_ID, collectionId, doc.$id);
                totalDeleted++;
                process.stdout.write(`\rDocuments supprimés de ${collectionId}: ${totalDeleted}`);
            }

            if (response.documents.length < 100) {
                hasMore = false;
            }
        } catch (error) {
            console.error(`\nErreur lors de la suppression des documents de ${collectionId}:`, error.message);
            hasMore = false;
        }
    }
    console.log(`\nTerminé la suppression des documents de la collection ${collectionId}. Total supprimé : ${totalDeleted}`);
}

async function clearAllReservationData() {
    if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
        console.error('Erreur: Les variables d\'environnement Appwrite ne sont pas définies. Assurez-vous que NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID et APPWRITE_API_KEY sont configurées dans votre fichier .env.local.');
        process.exit(1);
    }

    try {
        console.log('Début de la suppression des données de réservation...');
        await clearCollection(RESERVATION_ITEMS_COLLECTION_ID);
        await clearCollection(RESERVATIONS_COLLECTION_ID);
        console.log('Toutes les données de réservation ont été supprimées avec succès.');
    } catch (error) {
        console.error('Erreur lors de la suppression des données de réservation:', error);
    }
}

clearAllReservationData();