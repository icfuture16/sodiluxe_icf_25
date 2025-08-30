import { getStores } from '@/lib/server/queries';
import ReservationsClientPage from './ReservationsClientPage';

/**
 * Page serveur des réservations
 * Récupère les données côté serveur pour éviter les erreurs d'hydratation
 */
export default async function ReservationsPage() {
  // Récupération déterministe des magasins côté serveur
  const stores = await getStores();

  return <ReservationsClientPage stores={stores} />;
}