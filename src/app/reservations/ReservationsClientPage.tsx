'use client'

import { useEffect, useState } from 'react';
import ReservationList from '@/components/reservations/ReservationList'
import { Store } from '@/types/appwrite.types';

interface ReservationsClientPageProps {
  stores: Store[];
}

/**
 * Composant client pour la page des réservations
 * Utilise les données initiales du serveur pour éviter les erreurs d'hydratation
 */
export default function ReservationsClientPage({ stores: initialStores }: ReservationsClientPageProps) {
  const [stores, setStores] = useState(initialStores);

  // ⚠️ Toute MAJ client ultérieure, mais l'UI initiale == SSR
  useEffect(() => {
    (async () => {
      // Re-fetch si besoin, en gardant les mêmes filtres/params que SSR
      // Pour l'instant, on utilise les données initiales du serveur
      // const fresh = await fetch(...).then(r => r.json());
      // setStores(fresh);
    })();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <ReservationList stores={stores} />
    </div>
  );
}